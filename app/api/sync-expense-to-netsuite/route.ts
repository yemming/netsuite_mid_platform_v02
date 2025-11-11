import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 同步報支到 NetSuite
 * 說明：將審核通過的報支項目同步到 NetSuite Expense Report
 */
export async function POST(request: Request) {
  let review_id: string | undefined;
  try {
    const body = await request.json();
    review_id = body.review_id;

    if (!review_id) {
      return NextResponse.json(
        { error: '請提供報支審核 ID' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 取得報支審核資料（表頭）
    const { data: review, error: reviewError } = await supabase
      .from('expense_reviews')
      .select('*')
      .eq('id', review_id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: '找不到報支審核資料', details: reviewError?.message },
        { status: 404 }
      );
    }

    // 取得報支明細資料（表身）
    const { data: expenseLines, error: linesError } = await supabase
      .from('expense_lines')
      .select('*')
      .eq('expense_review_id', review_id)
      .order('line_number', { ascending: true });

    if (linesError) {
      return NextResponse.json(
        { error: '找不到報支明細資料', details: linesError.message },
        { status: 404 }
      );
    }

    if (!expenseLines || expenseLines.length === 0) {
      return NextResponse.json(
        { error: '報支項目沒有明細資料，無法同步' },
        { status: 400 }
      );
    }

    // 檢查審核狀態
    if (review.review_status !== 'approved') {
      return NextResponse.json(
        { error: `報支尚未審核通過，目前狀態：${review.review_status}` },
        { status: 400 }
      );
    }

    // 檢查是否已經同步過
    if (review.netsuite_sync_status === 'success' && review.netsuite_internal_id) {
      return NextResponse.json(
        { 
          error: '此報支已經同步到 NetSuite',
          netsuite_internal_id: review.netsuite_internal_id,
          netsuite_tran_id: review.netsuite_tran_id,
        },
        { status: 400 }
      );
    }

    // 檢查是否正在同步中
    if (review.netsuite_sync_status === 'syncing') {
      return NextResponse.json(
        { error: '此報支正在同步中，請稍候' },
        { status: 400 }
      );
    }

    // 更新同步狀態為「同步中」
    await supabase
      .from('expense_reviews')
      .update({
        netsuite_sync_status: 'syncing',
        netsuite_sync_error: null,
      })
      .eq('id', review_id);

    // 驗證 NetSuite 環境變數
    const requiredEnvVars = [
      'NETSUITE_ACCOUNT_ID',
      'NETSUITE_CONSUMER_KEY',
      'NETSUITE_CONSUMER_SECRET',
      'NETSUITE_TOKEN_ID',
      'NETSUITE_TOKEN_SECRET',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      await supabase
        .from('expense_reviews')
        .update({
          netsuite_sync_status: 'failed',
          netsuite_sync_error: `NetSuite 環境變數未設定: ${missingVars.join(', ')}`,
          netsuite_sync_retry_count: (review.netsuite_sync_retry_count || 0) + 1,
        })
        .eq('id', review_id);

      return NextResponse.json(
        { error: `NetSuite 環境變數未設定: ${missingVars.join(', ')}` },
        { status: 500 }
      );
    }

    // 取得 NetSuite API Client
    const netsuite = getNetSuiteAPIClient();

    // 查詢相關主檔的 NetSuite Internal ID（並行查詢以提升效能）
    const queries: PromiseLike<any>[] = [];
    
    // 1. Subsidiary（需要取得 base_currency_id 用於 header）
    let subsidiaryId: number | null = null;
    let subsidiaryBaseCurrencyId: number | null = null;
    if (review.subsidiary_id) {
      queries.push(
        supabase
          .from('ns_subsidiaries')
          .select('netsuite_internal_id, base_currency_id')
          .eq('id', review.subsidiary_id)
          .maybeSingle()
          .then(({ data: subsidiary }) => {
            subsidiaryId = subsidiary?.netsuite_internal_id || null;
            subsidiaryBaseCurrencyId = subsidiary?.base_currency_id || null;
          })
      );
    }

    // 2. Employee (Entity)
    let employeeId: number | null = null;
    if (review.employee_id) {
      queries.push(
        supabase
          .from('ns_entities_employees')
          .select('netsuite_internal_id')
          .eq('id', review.employee_id)
          .maybeSingle()
          .then(({ data: employee }) => {
            employeeId = employee?.netsuite_internal_id || null;
          })
      );
    }

    // 3. Header Currency（使用公司的基準幣別，如果找不到則使用報支幣別作為備用）
    let headerCurrencyId: number | null = subsidiaryBaseCurrencyId;

    // 4. Expense Item Currency（從 expense_lines 取得幣別）
    // 注意：現在幣別資訊在 expense_lines 表中，不在 expense_reviews 表頭
    // 使用第一個 line 的幣別（如果所有 lines 使用相同幣別）
    // 如果有多幣別，需要處理每個 line 的幣別
    let expenseItemCurrencyId: number | null = null;
    const firstLineCurrencyId = expenseLines[0]?.currency_id;
    if (firstLineCurrencyId) {
      queries.push(
        supabase
          .from('ns_currencies')
          .select('netsuite_internal_id')
          .eq('id', firstLineCurrencyId)
          .maybeSingle()
          .then(({ data: currency }) => {
            expenseItemCurrencyId = currency?.netsuite_internal_id || null;
          })
      );
    }

    // 5. Expense Category（從 expense_lines 取得）
    // 注意：現在費用類別資訊在 expense_lines 表中，不在 expense_reviews 表頭
    // 使用第一個 line 的費用類別（如果所有 lines 使用相同類別）
    let expenseCategoryId: number | null = null;
    const firstLineCategoryId = expenseLines[0]?.category_id;
    if (firstLineCategoryId) {
      queries.push(
        supabase
          .from('ns_expense_categories')
          .select('netsuite_internal_id')
          .eq('id', firstLineCategoryId)
          .maybeSingle()
          .then(({ data: category }) => {
            expenseCategoryId = category?.netsuite_internal_id || null;
          })
      );
    }

    // 6. Department (可選)
    let departmentId: number | null = null;
    if (review.department_id) {
      queries.push(
        supabase
          .from('ns_departments')
          .select('netsuite_internal_id')
          .eq('id', review.department_id)
          .maybeSingle()
          .then(({ data: department }) => {
            departmentId = department?.netsuite_internal_id || null;
          })
      );
    }

    // 7. Class (可選)
    let classId: number | null = null;
    if (review.class_id) {
      queries.push(
        supabase
          .from('ns_classes')
          .select('netsuite_internal_id')
          .eq('id', review.class_id)
          .maybeSingle()
          .then(({ data: classData }) => {
            classId = classData?.netsuite_internal_id || null;
          })
      );
    }

    // 8. Location (可選) - 需要先取得 subsidiaryId，所以放在最後
    let locationId: number | null = null;
    const locationQuery = review.location_id
      ? supabase
          .from('ns_locations')
          .select('netsuite_internal_id, subsidiary_id, is_inactive')
          .eq('id', review.location_id)
          .eq('is_inactive', false)
          .maybeSingle()
      : Promise.resolve({ data: null });

    // 等待所有查詢完成（並行執行）
    await Promise.all(queries);

    // 處理 Location（需要 subsidiaryId，所以單獨處理）
    if (review.location_id) {
      const { data: location } = await locationQuery;
      if (location?.netsuite_internal_id && subsidiaryId) {
        // 驗證 location 是否屬於指定的 subsidiary
        if (!location.subsidiary_id || location.subsidiary_id === subsidiaryId) {
          locationId = location.netsuite_internal_id;
        } else if (process.env.NODE_ENV === 'development') {
          // 只在開發環境記錄警告
          console.warn(
            `[Sync Expense] Location ${location.netsuite_internal_id} 不屬於 Subsidiary ${subsidiaryId}，將跳過 location 欄位`
          );
        }
      }
    }

    // ⚠️ 重要：如果找不到公司基準幣別，使用報支幣別作為備用
    if (!headerCurrencyId && expenseItemCurrencyId) {
      console.warn('[Sync Expense] 找不到公司基準幣別，使用報支幣別作為備用');
      headerCurrencyId = expenseItemCurrencyId;
    }

    // 驗證必填欄位
    if (!subsidiaryId) {
      await supabase
        .from('expense_reviews')
        .update({
          netsuite_sync_status: 'failed',
          netsuite_sync_error: '找不到公司別對應的 NetSuite ID',
          netsuite_sync_retry_count: (review.netsuite_sync_retry_count || 0) + 1,
        })
        .eq('id', review_id);

      return NextResponse.json(
        { error: '找不到公司別對應的 NetSuite ID' },
        { status: 400 }
      );
    }

    if (!employeeId) {
      await supabase
        .from('expense_reviews')
        .update({
          netsuite_sync_status: 'failed',
          netsuite_sync_error: '找不到員工對應的 NetSuite ID',
          netsuite_sync_retry_count: (review.netsuite_sync_retry_count || 0) + 1,
        })
        .eq('id', review_id);

      return NextResponse.json(
        { error: '找不到員工對應的 NetSuite ID' },
        { status: 400 }
      );
    }

    if (!headerCurrencyId) {
      await supabase
        .from('expense_reviews')
        .update({
          netsuite_sync_status: 'failed',
          netsuite_sync_error: '找不到公司基準幣別或報支幣別對應的 NetSuite ID',
          netsuite_sync_retry_count: (review.netsuite_sync_retry_count || 0) + 1,
        })
        .eq('id', review_id);

      return NextResponse.json(
        { error: '找不到公司基準幣別或報支幣別對應的 NetSuite ID' },
        { status: 400 }
      );
    }

    if (!expenseItemCurrencyId) {
      await supabase
        .from('expense_reviews')
        .update({
          netsuite_sync_status: 'failed',
          netsuite_sync_error: '找不到報支幣別對應的 NetSuite ID',
          netsuite_sync_retry_count: (review.netsuite_sync_retry_count || 0) + 1,
        })
        .eq('id', review_id);

      return NextResponse.json(
        { error: '找不到報支幣別對應的 NetSuite ID' },
        { status: 400 }
      );
    }

    if (!expenseCategoryId) {
      await supabase
        .from('expense_reviews')
        .update({
          netsuite_sync_status: 'failed',
          netsuite_sync_error: '找不到費用類別對應的 NetSuite ID',
          netsuite_sync_retry_count: (review.netsuite_sync_retry_count || 0) + 1,
        })
        .eq('id', review_id);

      return NextResponse.json(
        { error: '找不到費用類別對應的 NetSuite ID' },
        { status: 400 }
      );
    }

    // 組裝 NetSuite Expense Report Payload
    // ⚠️ 重要：從中臺打進來的資料需要有「鋪路」的資料，所以 accountingapproval 和 supervisorapproval 設為 true
    // Header 層級的 currency 使用公司的基準幣別
    // 注意：此時 subsidiaryId, employeeId, headerCurrencyId 已經通過驗證，不會為 null
    const expenseReportPayload: any = {
      recordType: 'expenseReport',
      subsidiary: { id: String(subsidiaryId) },
      entity: { id: String(employeeId) },
      currency: { id: String(headerCurrencyId) }, // Header 使用公司基準幣別
      trandate: review.expense_date, // 使用小寫 trandate（參考 Payroll 範例）
      accountingapproval: true, // ✅ 從中臺打進來的資料需要有「鋪路」的資料，設為 true
      supervisorapproval: true, // ✅ 從中臺打進來的資料需要有「鋪路」的資料，設為 true
    };

    // 選填欄位
    if (departmentId) {
      expenseReportPayload.department = { id: String(departmentId) };
    }

    if (classId) {
      expenseReportPayload.class = { id: String(classId) };
    }

    if (locationId) {
      expenseReportPayload.location = { id: String(locationId) };
    }

    // 備註
    if (review.description) {
      expenseReportPayload.memo = review.description;
    }

    // Expense Items（費用明細）
    // ⚠️ 重要：現在需要從 expense_lines 建立多個 expense items
    // 每個 expense_line 對應一個 NetSuite expense item
    
    // 先查詢所有 expense_lines 需要的 NetSuite IDs（並行查詢）
    const lineQueries: PromiseLike<any>[] = [];
    const lineNetSuiteData: Array<{
      categoryId: number | null;
      currencyId: number | null;
      departmentId: number | null;
      classId: number | null;
      locationId: number | null;
    }> = [];

    // 為每個 line 查詢 NetSuite IDs
    for (let i = 0; i < expenseLines.length; i++) {
      const line = expenseLines[i];
      lineNetSuiteData[i] = {
        categoryId: null,
        currencyId: null,
        departmentId: null,
        classId: null,
        locationId: null,
      };

      // Category
      if (line.category_id) {
        lineQueries.push(
          supabase
            .from('ns_expense_categories')
            .select('netsuite_internal_id')
            .eq('id', line.category_id)
            .maybeSingle()
            .then(({ data: category }) => {
              lineNetSuiteData[i].categoryId = category?.netsuite_internal_id || null;
            })
        );
      }

      // Currency
      if (line.currency_id) {
        lineQueries.push(
          supabase
            .from('ns_currencies')
            .select('netsuite_internal_id')
            .eq('id', line.currency_id)
            .maybeSingle()
            .then(({ data: currency }) => {
              lineNetSuiteData[i].currencyId = currency?.netsuite_internal_id || null;
            })
        );
      }

      // Department (可選)
      if (line.department_id) {
        lineQueries.push(
          supabase
            .from('ns_departments')
            .select('netsuite_internal_id')
            .eq('id', line.department_id)
            .maybeSingle()
            .then(({ data: department }) => {
              lineNetSuiteData[i].departmentId = department?.netsuite_internal_id || null;
            })
        );
      }

      // Class (可選)
      if (line.class_id) {
        lineQueries.push(
          supabase
            .from('ns_classes')
            .select('netsuite_internal_id')
            .eq('id', line.class_id)
            .maybeSingle()
            .then(({ data: classData }) => {
              lineNetSuiteData[i].classId = classData?.netsuite_internal_id || null;
            })
        );
      }

      // Location (可選)
      if (line.location_id) {
        lineQueries.push(
          supabase
            .from('ns_locations')
            .select('netsuite_internal_id')
            .eq('id', line.location_id)
            .maybeSingle()
            .then(({ data: location }) => {
              lineNetSuiteData[i].locationId = location?.netsuite_internal_id || null;
            })
        );
      }
    }

    // 等待所有 line 的查詢完成
    await Promise.all(lineQueries);

    // 建立 expense items
    const expenseItems: any[] = [];
    for (let i = 0; i < expenseLines.length; i++) {
      const line = expenseLines[i];
      const lineData = lineNetSuiteData[i];

      // 驗證必填欄位
      if (!lineData.categoryId || !lineData.currencyId || !line.gross_amt) {
        await supabase
          .from('expense_reviews')
          .update({
            netsuite_sync_status: 'failed',
            netsuite_sync_error: `第 ${i + 1} 筆明細缺少必填欄位：category, currency 或 amount`,
            netsuite_sync_retry_count: (review.netsuite_sync_retry_count || 0) + 1,
          })
          .eq('id', review_id);

        return NextResponse.json(
          { error: `第 ${i + 1} 筆明細缺少必填欄位：category, currency 或 amount` },
          { status: 400 }
        );
      }

      const item: any = {
        expensedate: line.date || review.expense_date,
        category: { id: String(lineData.categoryId) },
        amount: parseFloat(String(line.gross_amt)),
        currency: { id: String(lineData.currencyId) },
      };

      // 可選欄位
      if (line.memo) {
        item.memo = line.memo.substring(0, 4000);
      }

      if (lineData.departmentId) {
        item.department = { id: String(lineData.departmentId) };
      }

      if (lineData.classId) {
        item.class = { id: String(lineData.classId) };
      }

      if (lineData.locationId) {
        item.location = { id: String(lineData.locationId) };
      }

      expenseItems.push(item);
    }

    expenseReportPayload.expense = {
      items: expenseItems,
    };

    // 使用第一個 line 的 category 和 currency 作為主要值（用於驗證和日誌）
    expenseCategoryId = lineNetSuiteData[0]?.categoryId || null;
    expenseItemCurrencyId = lineNetSuiteData[0]?.currencyId || null;

    // 如果有發票號碼，可以加到 memo（從第一個 line 取得）
    const firstLineInvoiceNumber = expenseLines[0]?.invoice_number;
    if (firstLineInvoiceNumber) {
      expenseReportPayload.memo = `${expenseReportPayload.memo || ''}\n發票號碼: ${firstLineInvoiceNumber}`.trim();
    }

    // 計算總金額（從所有 expense_lines 加總）
    const totalAmount = expenseLines.reduce((sum, line) => {
      return sum + (parseFloat(String(line.gross_amt)) || 0);
    }, 0);

    // Debug: 只在開發環境記錄（減少生產環境的日誌輸出）
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sync Expense] 準備發送到 NetSuite:', {
        subsidiaryId,
        employeeId,
        headerCurrencyId,
        expenseItemCurrencyId,
        expenseCategoryId,
        totalAmount,
        linesCount: expenseLines.length,
        items: expenseItems.map(item => ({
          category: item.category.id,
          currency: item.currency.id,
          amount: item.amount,
        })),
        payload: JSON.stringify(expenseReportPayload, null, 2), // 記錄完整 payload
      });
    }

           try {
             const startTime = Date.now();
             // 呼叫 NetSuite API 建立 Expense Report
             const netsuiteResponse = await netsuite.createRecord('expenseReport', expenseReportPayload);
             const duration = Date.now() - startTime;
             
             // 只在開發環境或耗時過長時記錄
             if (process.env.NODE_ENV === 'development' || duration > 5000) {
               console.log(`[Sync Expense] NetSuite API 呼叫耗時: ${duration}ms`);
             }

             // 處理 NetSuite 回應（可能是空字串但從 Location header 取得 ID）
             let netsuiteInternalId: number | null = null;
             let netsuiteTranId: string | null = null;
             
             // 如果回應中有 id（從 Location header 提取的）
             if (netsuiteResponse.id) {
               netsuiteInternalId = parseInt(netsuiteResponse.id);
             } else if (netsuiteResponse.tranId) {
               // 如果只有 tranId，可能需要從其他地方取得 ID
               netsuiteTranId = netsuiteResponse.tranId;
             } else {
               // 如果都沒有，嘗試從 Location header 取得（應該已經在 netsuiteResponse.location 中）
               if (netsuiteResponse.location) {
                 const locationMatch = netsuiteResponse.location.match(/\/(\d+)$/);
                 if (locationMatch) {
                   netsuiteInternalId = parseInt(locationMatch[1]);
                 }
               }
             }

             if (!netsuiteInternalId) {
               throw new Error('無法從 NetSuite 回應中取得記錄 ID');
             }

             // 查詢已建立的記錄以取得 tranId（NetSuite 建立回應通常不包含 tranId）
             try {
               const createdRecord = await netsuite.getRecord('expenseReport', netsuiteInternalId.toString());
               if (createdRecord && createdRecord.tranId) {
                 netsuiteTranId = createdRecord.tranId;
                 console.log(`[Sync Expense] 從查詢記錄取得 tranId: ${netsuiteTranId}`);
               } else if (createdRecord && createdRecord.tranid) {
                 // 某些 NetSuite API 可能使用小寫 tranid
                 netsuiteTranId = createdRecord.tranid;
                 console.log(`[Sync Expense] 從查詢記錄取得 tranid: ${netsuiteTranId}`);
               } else {
                 console.warn(`[Sync Expense] 查詢記錄後仍無法取得 tranId，記錄內容:`, JSON.stringify(createdRecord).substring(0, 200));
               }
             } catch (queryError: any) {
               // 查詢失敗不影響主要流程，但記錄警告
               console.warn(`[Sync Expense] 查詢已建立的記錄失敗，無法取得 tranId:`, queryError.message);
               // 如果回應中有 tranId，使用回應中的
               if (netsuiteResponse.tranId) {
                 netsuiteTranId = netsuiteResponse.tranId;
               }
             }

             // 生成 NetSuite 網址（用於直接連結到 NetSuite UI）
             // ⚠️ 正確格式：/app/accounting/transactions/exprept.nl?id=...（不是 /app/common/transaction/transaction.nl）
             const netsuiteAccountId = process.env.NETSUITE_ACCOUNT_ID || '';
             const netsuiteUrl = netsuiteInternalId 
               ? `https://${netsuiteAccountId.toLowerCase()}.app.netsuite.com/app/accounting/transactions/exprept.nl?id=${netsuiteInternalId}&whence=`
               : null;

             // 更新同步狀態為「成功」
             const updateData: any = {
               netsuite_sync_status: 'success',
               netsuite_internal_id: netsuiteInternalId,
               netsuite_tran_id: netsuiteTranId || netsuiteResponse.tranId || null,
               netsuite_synced_at: new Date().toISOString(),
               netsuite_sync_error: null,
               netsuite_request_payload: expenseReportPayload,
               netsuite_response_payload: netsuiteResponse,
               netsuite_sync_retry_count: review.netsuite_sync_retry_count || 0,
               netsuite_url: netsuiteUrl, // 新增：儲存 NetSuite 網址到資料庫
             };

      const { error: updateError } = await supabase
        .from('expense_reviews')
        .update(updateData)
        .eq('id', review_id);

      if (updateError) {
        console.error('更新同步狀態錯誤:', updateError);
        // 即使更新失敗，NetSuite 已經建立成功，所以返回成功
      }

      // 記錄到 transaction_references 表（可選）
      try {
        await supabase
          .from('transaction_references')
          .insert({
            source_system: 'EXPENSE_REVIEW',
            source_transaction_id: review_id,
            source_transaction_type: 'ExpenseReport',
            netsuite_record_type: 'expenseReport',
            netsuite_internal_id: parseInt(netsuiteResponse.id),
            netsuite_tran_id: netsuiteResponse.tranId || null,
            status: 'success',
            request_payload: expenseReportPayload,
            response_payload: netsuiteResponse,
            synced_at: new Date().toISOString(),
          });
      } catch (refError) {
        // 記錄失敗不影響主要流程
        console.warn('記錄到 transaction_references 失敗:', refError);
      }

             return NextResponse.json({
               success: true,
               message: '報支已成功同步到 NetSuite',
               netsuite_internal_id: netsuiteInternalId,
               netsuite_tran_id: netsuiteTranId || netsuiteResponse.tranId || null,
               netsuite_url: netsuiteUrl, // 新增：NetSuite 網址
               data: netsuiteResponse,
             });

    } catch (netsuiteError: any) {
      console.error('NetSuite API 錯誤:', netsuiteError);

      // 更新同步狀態為「失敗」
      let errorMessage = netsuiteError.message || netsuiteError.toString() || '未知錯誤';
      const errorDetails = netsuiteError.response?.data || netsuiteError.body || null;
      
      // 解析 NetSuite 錯誤詳情，提供更清楚的錯誤訊息
      if (errorDetails && typeof errorDetails === 'object') {
        // 檢查是否有 o:errorDetails 陣列
        if (errorDetails['o:errorDetails'] && Array.isArray(errorDetails['o:errorDetails'])) {
          const errorDetail = errorDetails['o:errorDetails'][0];
          if (errorDetail && errorDetail.detail) {
            const detail = errorDetail.detail;
            
            // 處理稅務期間錯誤
            if (detail.includes('tax period') || detail.includes('Tax Period')) {
              errorMessage = `NetSuite 稅務期間錯誤：${detail}\n\n請在 NetSuite 中設定稅務期間：\n1. 前往 Setup > Manage Tax Periods\n2. 建立對應報支日期的稅務期間\n3. 確保稅務期間狀態為「開放」（Open）`;
            } else {
              // 其他 NetSuite 錯誤，直接使用 detail
              errorMessage = `NetSuite 錯誤：${detail}`;
            }
          }
        } else if (errorDetails.detail) {
          // 如果錯誤詳情直接在 detail 欄位
          const detail = errorDetails.detail;
          if (detail.includes('tax period') || detail.includes('Tax Period')) {
            errorMessage = `NetSuite 稅務期間錯誤：${detail}\n\n請在 NetSuite 中設定稅務期間：\n1. 前往 Setup > Manage Tax Periods\n2. 建立對應報支日期的稅務期間\n3. 確保稅務期間狀態為「開放」（Open）`;
          } else {
            errorMessage = `NetSuite 錯誤：${detail}`;
          }
        }
      }

      await supabase
        .from('expense_reviews')
        .update({
          netsuite_sync_status: 'failed',
          netsuite_sync_error: errorMessage,
          netsuite_sync_retry_count: (review.netsuite_sync_retry_count || 0) + 1,
          netsuite_request_payload: expenseReportPayload,
          netsuite_response_payload: errorDetails,
        })
        .eq('id', review_id);

      return NextResponse.json(
        {
          error: 'NetSuite 同步失敗',
          message: errorMessage,
          details: errorDetails,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('同步報支到 NetSuite 錯誤:', error);
    console.error('錯誤堆疊:', error.stack);
    
    // 更新同步狀態為「失敗」（如果 review_id 存在）
    if (review_id) {
      try {
        const supabase = await createClient();
        const { data: existingReview } = await supabase
          .from('expense_reviews')
          .select('netsuite_sync_retry_count')
          .eq('id', review_id)
          .single();
        
        await supabase
          .from('expense_reviews')
          .update({
            netsuite_sync_status: 'failed',
            netsuite_sync_error: error.message || error.toString() || '未知錯誤',
            netsuite_sync_retry_count: (existingReview?.netsuite_sync_retry_count || 0) + 1,
          })
          .eq('id', review_id);
      } catch (updateError) {
        console.error('更新同步狀態失敗:', updateError);
      }
    }
    
    return NextResponse.json(
      {
        error: '同步失敗',
        message: error.message || '未知錯誤',
        details: error.toString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

