import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 同步報支到 NetSuite
 * 說明：將審核通過的報支項目同步到 NetSuite Expense Report
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { review_id } = body;

    if (!review_id) {
      return NextResponse.json(
        { error: '請提供報支審核 ID' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 取得報支審核資料
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
    const queries: Promise<any>[] = [];
    
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

    // 4. Expense Item Currency（使用報支時選擇的幣別）
    let expenseItemCurrencyId: number | null = null;
    if (review.currency_id) {
      queries.push(
        supabase
          .from('ns_currencies')
          .select('netsuite_internal_id')
          .eq('id', review.currency_id)
          .maybeSingle()
          .then(({ data: currency }) => {
            expenseItemCurrencyId = currency?.netsuite_internal_id || null;
          })
      );
    }

    // 5. Expense Category
    let expenseCategoryId: number | null = null;
    if (review.expense_category_id) {
      queries.push(
        supabase
          .from('ns_expense_categories')
          .select('netsuite_internal_id')
          .eq('id', review.expense_category_id)
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
    // ⚠️ 重要：根據成功範例，accountingapproval 和 supervisorapproval 應該設為 false
    // Header 層級的 currency 使用公司的基準幣別
    const expenseReportPayload: any = {
      recordType: 'expenseReport',
      subsidiary: { id: subsidiaryId.toString() },
      entity: { id: employeeId.toString() },
      currency: { id: headerCurrencyId.toString() }, // Header 使用公司基準幣別
      trandate: review.expense_date, // 使用小寫 trandate（參考 Payroll 範例）
      accountingapproval: false, // ⚠️ 根據成功範例，設為 false（NetSuite 會自動處理審批流程）
      supervisorapproval: false, // ⚠️ 根據成功範例，設為 false（NetSuite 會自動處理審批流程）
    };

    // 選填欄位
    if (departmentId) {
      expenseReportPayload.department = { id: departmentId.toString() };
    }

    if (classId) {
      expenseReportPayload.class = { id: classId.toString() };
    }

    if (locationId) {
      expenseReportPayload.location = { id: locationId.toString() };
    }

    // 備註
    if (review.description) {
      expenseReportPayload.memo = review.description;
    }

    // Expense Items（費用明細）
    // ⚠️ 重要：參考 Payroll 範例，expense item 需要 expensedate 欄位
    // Expense items 層級的 currency 使用報支時選擇的幣別
    // ⚠️ 驗證：確保所有必填欄位都有值
    if (!expenseCategoryId || !expenseItemCurrencyId || !review.receipt_amount) {
      await supabase
        .from('expense_reviews')
        .update({
          netsuite_sync_status: 'failed',
          netsuite_sync_error: 'Expense item 缺少必填欄位：category, currency 或 amount',
          netsuite_sync_retry_count: (review.netsuite_sync_retry_count || 0) + 1,
        })
        .eq('id', review_id);

      return NextResponse.json(
        { error: 'Expense item 缺少必填欄位：category, currency 或 amount' },
        { status: 400 }
      );
    }

    expenseReportPayload.expense = {
      items: [
        {
          expensedate: review.expense_date, // ✅ 參考 Payroll 範例，expense item 需要 expensedate
          category: { id: expenseCategoryId.toString() },
          amount: parseFloat(review.receipt_amount.toString()), // 確保是數字類型
          currency: { id: expenseItemCurrencyId.toString() }, // Expense item 使用報支幣別
          memo: (review.description || `${review.expense_category_name || ''} - ${review.invoice_number || ''}`.trim()).substring(0, 4000), // NetSuite memo 有長度限制
        },
      ],
    };

    // 如果有發票號碼，可以加到 memo
    if (review.invoice_number) {
      expenseReportPayload.memo = `${expenseReportPayload.memo || ''}\n發票號碼: ${review.invoice_number}`.trim();
    }

    // Debug: 只在開發環境記錄（減少生產環境的日誌輸出）
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sync Expense] 準備發送到 NetSuite:', {
        subsidiaryId,
        employeeId,
        headerCurrencyId,
        expenseItemCurrencyId,
        expenseCategoryId,
        amount: review.receipt_amount,
        currency: review.receipt_currency,
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
      const errorMessage = netsuiteError.message || netsuiteError.toString() || '未知錯誤';
      const errorDetails = netsuiteError.response?.data || netsuiteError.body || null;

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
    return NextResponse.json(
      {
        error: '同步失敗',
        message: error.message || '未知錯誤',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

