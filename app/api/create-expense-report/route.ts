import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 建立報支項目（寫入審核表）
 * 說明：報支資料先寫入 expense_reviews 表（表頭）和 expense_lines 表（表身），待財務人員審核後再同步到 NetSuite
 * 
 * 請求格式：
 * {
 *   header: {
 *     expenseDate: string,
 *     employee: string, // UUID
 *     subsidiary: string, // UUID
 *     description?: string,
 *   },
 *   lines: Array<{
 *     refNo: number,
 *     date: string,
 *     category: string, // UUID
 *     currency: string, // UUID
 *     amount: string,
 *     grossAmt: string,
 *     // ... 其他欄位
 *     ocrData: { ... },
 *     attachment_url?: string,
 *     attachment_base64?: string,
 *   }>
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { header, lines, reviewStatus } = body;

    // 驗證請求格式
    if (!header || !lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { error: '請提供表頭資料和至少一筆明細資料' },
        { status: 400 }
      );
    }

    const { expenseDate, employee, subsidiary, description, useMultiCurrency } = header;

    // 驗證表頭必填欄位
    if (!expenseDate || !employee || !subsidiary) {
      return NextResponse.json(
        { error: '請填寫所有必填欄位（報支日期、員工、公司別）' },
        { status: 400 }
      );
    }

    // 驗證 lines 必填欄位
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.date || !line.category || !line.currency || !line.amount || !line.grossAmt) {
        return NextResponse.json(
          { error: `第 ${i + 1} 筆明細缺少必填欄位（日期、類別、幣別、金額、總金額）` },
          { status: 400 }
        );
      }
      if (parseFloat(line.amount) <= 0 || parseFloat(line.grossAmt) <= 0) {
        return NextResponse.json(
          { error: `第 ${i + 1} 筆明細的金額或總金額必須大於 0` },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // 取得當前使用者資訊
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: '無法取得使用者資訊，請重新登入' },
        { status: 401 }
      );
    }

    // 查詢 Employee（Entity）
    let employeeId: string | null = null;
    let employeeName: string | null = null;
    const { data: empData } = await supabase
      .from('ns_entities_employees')
      .select('id, name')
      .eq('id', employee)
      .eq('is_inactive', false)
      .maybeSingle();
    
    if (!empData) {
      return NextResponse.json(
        { error: `找不到員工（ID: ${employee}），請確認員工是否正確或已同步到系統` },
        { status: 400 }
      );
    }
    employeeId = empData.id;
    employeeName = empData.name;

    // 查詢 Subsidiary
    let subsidiaryId: string | null = null;
    let subsidiaryName: string | null = null;
    const { data: subData } = await supabase
      .from('ns_subsidiaries')
      .select('id, name')
      .eq('id', subsidiary)
      .eq('is_active', true)
      .maybeSingle();
    
    if (!subData) {
      return NextResponse.json(
        { error: `找不到公司別（ID: ${subsidiary}），請確認公司別是否正確或已同步到系統` },
        { status: 400 }
      );
    }
    subsidiaryId = subData.id;
    subsidiaryName = subData.name;

    // 取得使用者名稱
    const createdByName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || '未知使用者';

    // 1. 先建立表頭（expense_reviews）
    // 狀態：draft（草稿）或 pending（已提交審核中）
    const status = reviewStatus === 'pending' ? 'pending' : 'draft';
    
    // 只有在提交（pending）時才生成費用報告編號，草稿狀態不生成
    let expenseReportNumber: string | null = null;
    if (status === 'pending') {
      // 生成費用報告編號：EXP-YYYYMMDD-XXXXX
      // 解析日期字串（格式：YYYY-MM-DD）
      const [year, month, day] = expenseDate.split('-');
      if (!year || !month || !day) {
        return NextResponse.json(
          { error: '報支日期格式錯誤，應為 YYYY-MM-DD' },
          { status: 400 }
        );
      }
      const dateStr = `${year}${month}${day}`; // YYYYMMDD
      
      // 查詢當天已存在的報告數量（用於生成序號）
      // 只計算已提交（pending 或 approved）的報告，不包括草稿
      const dateStart = `${year}-${month}-${day}`;
      const nextDay = String(parseInt(day) + 1).padStart(2, '0');
      const dateEnd = `${year}-${month}-${nextDay}`;
      
      const { count: todayCount } = await supabase
        .from('expense_reviews')
        .select('*', { count: 'exact', head: true })
        .gte('expense_date', dateStart)
        .lt('expense_date', dateEnd)
        .not('expense_report_number', 'is', null); // 只計算已有編號的報告（已提交的）
      
      const sequenceNumber = (todayCount || 0) + 1;
      expenseReportNumber = `EXP-${dateStr}-${String(sequenceNumber).padStart(5, '0')}`;
    }
    
    const { data: reviewData, error: insertHeaderError } = await supabase
      .from('expense_reviews')
      .insert({
        expense_date: expenseDate,
        employee_id: employeeId,
        employee_name: employeeName,
        subsidiary_id: subsidiaryId,
        subsidiary_name: subsidiaryName,
        description: description || null,
        use_multi_currency: useMultiCurrency || false, // 使用多幣別
        review_status: status, // draft 或 pending
        netsuite_sync_status: 'pending',
        expense_report_number: expenseReportNumber, // 只有提交時才有編號，草稿為 null
        created_by: user.id,
        created_by_name: createdByName,
      })
      .select()
      .single();

    if (insertHeaderError || !reviewData) {
      console.error('寫入表頭錯誤:', insertHeaderError);
      return NextResponse.json(
        { 
          error: '寫入表頭失敗',
          message: insertHeaderError?.message || '未知錯誤',
          details: insertHeaderError
        },
        { status: 500 }
      );
    }

    const expenseReviewId = reviewData.id;

    // 2. 批次查詢所有需要的資料（優化效能：減少資料庫查詢次數）
    // 收集所有需要的 ID（去重）
    const categoryIds = new Set<string>();
    const currencyIds = new Set<string>();
    const departmentIds = new Set<string>();
    const classIds = new Set<string>();
    const locationIds = new Set<string>();

    lines.forEach((line: any) => {
      if (line.category) categoryIds.add(line.category);
      if (line.currency) currencyIds.add(line.currency);
      if (line.department) departmentIds.add(line.department);
      if (line.class) classIds.add(line.class);
      if (line.location) locationIds.add(line.location);
    });

    // 批次查詢所有資料
    const [categoriesResult, currenciesResult, departmentsResult, classesResult, locationsResult] = await Promise.all([
      categoryIds.size > 0 ? supabase
        .from('ns_expense_categories')
        .select('id, name')
        .in('id', Array.from(categoryIds))
        .eq('is_inactive', false) : Promise.resolve({ data: [], error: null }),
      currencyIds.size > 0 ? supabase
        .from('ns_currencies')
        .select('id, symbol, name')
        .in('id', Array.from(currencyIds))
        .eq('is_active', true) : Promise.resolve({ data: [], error: null }),
      departmentIds.size > 0 ? supabase
        .from('ns_departments')
        .select('id, name')
        .in('id', Array.from(departmentIds))
        .eq('is_inactive', false) : Promise.resolve({ data: [], error: null }),
      classIds.size > 0 ? supabase
        .from('ns_classes')
        .select('id, name')
        .in('id', Array.from(classIds))
        .eq('is_inactive', false) : Promise.resolve({ data: [], error: null }),
      locationIds.size > 0 ? supabase
        .from('ns_locations')
        .select('id, name')
        .in('id', Array.from(locationIds))
        .eq('is_inactive', false) : Promise.resolve({ data: [], error: null }),
    ]);

    // 建立快取 Map
    const categoriesMap = new Map<string, { id: string; name: string }>();
    (categoriesResult.data || []).forEach((cat: any) => {
      categoriesMap.set(cat.id, cat);
    });

    const currenciesMap = new Map<string, { id: string; symbol: string; name: string }>();
    (currenciesResult.data || []).forEach((curr: any) => {
      currenciesMap.set(curr.id, curr);
    });

    const departmentsMap = new Map<string, { id: string; name: string }>();
    (departmentsResult.data || []).forEach((dept: any) => {
      departmentsMap.set(dept.id, dept);
    });

    const classesMap = new Map<string, { id: string; name: string }>();
    (classesResult.data || []).forEach((cls: any) => {
      classesMap.set(cls.id, cls);
    });

    const locationsMap = new Map<string, { id: string; name: string }>();
    (locationsResult.data || []).forEach((loc: any) => {
      locationsMap.set(loc.id, loc);
    });

    // 3. 準備所有 lines 的資料（使用快取 Map，不再查詢資料庫）
    const linesToInsert = lines.map((line: any, index: number) => {
        const {
          refNo,
          date: lineDate,
          category,
          currency,
          foreignAmount,
          exchangeRate,
          amount,
          taxCode,
          taxRate,
          taxAmt,
          grossAmt,
          memo,
          department,
          class: classField,
          location,
          customer,
          projectTask,
          billable,
          ocrData,
          attachment_url,
          attachment_base64,
          document_file_name,
          document_file_path,
        } = line;

        // 從快取取得 Category（必填）
        let categoryId: string | null = null;
        let categoryName: string | null = null;
        if (!category || (typeof category === 'string' && category.trim() === '')) {
          throw new Error(`第 ${index + 1} 筆明細缺少費用類別`);
        }
        
        const catData = categoriesMap.get(category);
        if (!catData) {
          throw new Error(`第 ${index + 1} 筆明細找不到費用類別（ID: ${category}），請確認費用類別是否正確或已同步到系統`);
        }
        categoryId = catData.id;
        categoryName = catData.name;

        // 從快取取得 Currency（必填）
        let currencyId: string | null = null;
        let currencySymbol: string | null = null;
        if (!currency || (typeof currency === 'string' && currency.trim() === '')) {
          throw new Error(`第 ${index + 1} 筆明細缺少幣別`);
        }
        
        const currData = currenciesMap.get(currency);
        if (!currData) {
          throw new Error(`第 ${index + 1} 筆明細找不到幣別（ID: ${currency}），請確認幣別是否正確或已同步到系統`);
        }
        currencyId = currData.id;
        currencySymbol = currData.symbol;

        // 從快取取得 Department（可選）
        let departmentId: string | null = null;
        let departmentName: string | null = null;
        if (department) {
          const deptData = departmentsMap.get(department);
          if (deptData) {
            departmentId = deptData.id;
            departmentName = deptData.name;
          }
        }

        // 從快取取得 Class（可選）
        let classId: string | null = null;
        let className: string | null = null;
        if (classField) {
          const classData = classesMap.get(classField);
          if (classData) {
            classId = classData.id;
            className = classData.name;
          }
        }

        // 從快取取得 Location（可選）
        let locationId: string | null = null;
        let locationName: string | null = null;
        if (location) {
          const locData = locationsMap.get(location);
          if (locData) {
            locationId = locData.id;
            locationName = locData.name;
          }
        }

        // 處理 OCR 資料
        const ocr = ocrData || {};
        
        // 轉換日期格式
        let invoiceDateFormatted: Date | null = null;
        if (ocr.invoiceDate) {
          try {
            invoiceDateFormatted = new Date(ocr.invoiceDate);
            if (isNaN(invoiceDateFormatted.getTime())) {
              invoiceDateFormatted = null;
            }
          } catch (e) {
            invoiceDateFormatted = null;
          }
        }

        let ocrProcessedAtFormatted: Date | null = null;
        if (ocr.ocrProcessedAt) {
          try {
            ocrProcessedAtFormatted = new Date(ocr.ocrProcessedAt);
            if (isNaN(ocrProcessedAtFormatted.getTime())) {
              ocrProcessedAtFormatted = null;
            }
          } catch (e) {
            ocrProcessedAtFormatted = null;
          }
        }

        // 組裝 line 資料
        return {
          expense_review_id: expenseReviewId,
          line_number: refNo || index + 1,
          date: lineDate,
          category_id: categoryId,
          category_name: categoryName,
          currency_id: currencyId,
          currency: currencySymbol || null, // 如果查詢失敗，設為 null
          foreign_amount: foreignAmount ? parseFloat(foreignAmount) : null,
          exchange_rate: exchangeRate ? parseFloat(exchangeRate) : 1.0,
          amount: parseFloat(amount),
          tax_code: taxCode || null,
          tax_rate: taxRate ? parseFloat(taxRate) : null,
          tax_amt: taxAmt ? parseFloat(taxAmt) : null,
          gross_amt: parseFloat(grossAmt),
          memo: memo || null,
          department_id: departmentId,
          department_name: departmentName,
          class_id: classId,
          class_name: className,
          location_id: locationId,
          location_name: locationName,
          customer_id: customer || null,
          customer_name: null, // 如果需要，可以查詢並填入
          project_task_id: projectTask || null,
          project_task_name: null, // 如果需要，可以查詢並填入
          billable: billable || false,
          // OCR 識別結果
          invoice_title: ocr.invoiceTitle || null,
          invoice_period: ocr.invoicePeriod || null,
          invoice_number: ocr.invoiceNumber || null,
          invoice_date: invoiceDateFormatted,
          random_code: ocr.randomCode || null,
          format_code: ocr.formatCode || null,
          seller_name: ocr.sellerName || null,
          seller_tax_id: ocr.sellerTaxId || null,
          seller_address: ocr.sellerAddress || null,
          buyer_name: ocr.buyerName || null,
          buyer_tax_id: ocr.buyerTaxId || null,
          buyer_address: ocr.buyerAddress || null,
          untaxed_amount: ocr.untaxedAmount ? parseFloat(ocr.untaxedAmount) : null,
          tax_amount: ocr.taxAmount ? parseFloat(ocr.taxAmount) : null,
          total_amount: ocr.totalAmount ? parseFloat(ocr.totalAmount) : null,
          // OCR 元數據
          ocr_success: ocr.ocrSuccess || false,
          ocr_confidence: ocr.ocrConfidence ? parseFloat(ocr.ocrConfidence.toString()) : null,
          ocr_document_type: ocr.ocrDocumentType || null,
          ocr_errors: ocr.ocrErrors || null,
          ocr_warnings: ocr.ocrWarnings || null,
          ocr_error_count: ocr.ocrErrorCount || 0,
          ocr_warning_count: ocr.ocrWarningCount || 0,
          ocr_quality_grade: ocr.ocrQualityGrade || null,
          ocr_file_name: ocr.ocrFileName || null,
          ocr_file_id: ocr.ocrFileId || null,
          ocr_web_view_link: ocr.ocrWebViewLink || null,
          ocr_processed_at: ocrProcessedAtFormatted,
          // 文件檔案資訊
          document_file_name: document_file_name || ocr.ocrFileName || null,
          document_file_path: document_file_path || null,
          attachment_url: attachment_url || null,
          attachment_base64: attachment_base64 || null,
        };
      });

    // 4. 批次插入所有 lines
    console.log('準備插入 lines，數量:', linesToInsert.length);
    console.log('第一個 line 範例:', linesToInsert[0] ? {
      expense_review_id: linesToInsert[0].expense_review_id,
      line_number: linesToInsert[0].line_number,
      date: linesToInsert[0].date,
      category_id: linesToInsert[0].category_id,
      currency_id: linesToInsert[0].currency_id,
      amount: linesToInsert[0].amount,
      gross_amt: linesToInsert[0].gross_amt,
    } : null);
    
    const { data: linesData, error: insertLinesError } = await supabase
      .from('expense_lines')
      .insert(linesToInsert)
      .select();

    if (insertLinesError) {
      console.error('寫入表身錯誤:', insertLinesError);
      console.error('錯誤詳情:', {
        message: insertLinesError.message,
        details: insertLinesError,
        code: insertLinesError.code,
        hint: insertLinesError.hint,
      });
      
      // 如果插入 lines 失敗，刪除已建立的表頭（回滾）
      await supabase
        .from('expense_reviews')
        .delete()
        .eq('id', expenseReviewId);

      return NextResponse.json(
        { 
          error: '寫入表身失敗',
          message: insertLinesError.message || '未知錯誤',
          details: insertLinesError,
          hint: insertLinesError.hint || undefined,
          code: insertLinesError.code || undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '報支項目已成功提交，等待財務人員審核',
      expense_review_id: expenseReviewId,
      review_status: 'pending',
      lines_count: linesData?.length || 0,
      data: {
        header: reviewData,
        lines: linesData,
      },
    });

  } catch (error: any) {
    console.error('創建 Expense Report 錯誤:', error);
    console.error('錯誤詳情:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      details: error.toString()
    });
    return NextResponse.json(
      { 
        error: '創建報支項目失敗',
        message: error.message || '未知錯誤',
        details: error.toString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
