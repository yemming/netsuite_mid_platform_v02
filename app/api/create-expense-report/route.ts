import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 建立報支項目（寫入審核表）
 * 說明：報支資料先寫入 expense_reviews 表，待財務人員審核後再同步到 NetSuite
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      expenseDate,
      type, // 費用科目 ID
      employee, // 員工 ID
      subsidiary, // 公司別 ID
      expenseLocation, // 地點 ID
      department, // 部門 ID
      class: classField, // 類別 ID
      receiptAmount,
      receiptCurrency, // 幣別符號（如 TWD）
      description,
      receiptMissing,
      // OCR 識別結果
      invoiceTitle,
      invoicePeriod,
      invoiceNumber,
      invoiceDate,
      randomCode,
      formatCode,
      sellerName,
      sellerTaxId,
      sellerAddress,
      buyerName,
      buyerTaxId,
      buyerAddress,
      untaxedAmount,
      taxAmount,
      totalAmount,
      // OCR 元數據
      ocrSuccess,
      ocrConfidence,
      ocrDocumentType,
      ocrErrors,
      ocrWarnings,
      ocrErrorCount,
      ocrWarningCount,
      ocrQualityGrade,
      ocrFileName,
      ocrFileId,
      ocrWebViewLink,
      ocrProcessedAt,
      // 附件（圖片）
      attachment_url, // Supabase Storage URL（優先使用）
      attachment, // Base64 備用（如果 Storage 上傳失敗）
    } = body;

    // 驗證必填欄位
    if (!expenseDate || !type || !employee || !subsidiary) {
      return NextResponse.json(
        { error: '請填寫所有必填欄位（報支日期、費用科目、員工、公司別）' },
        { status: 400 }
      );
    }

    if (!receiptAmount || parseFloat(receiptAmount) <= 0) {
      return NextResponse.json(
        { error: '請輸入有效的收據金額' },
        { status: 400 }
      );
    }

    // 驗證幣別
    if (!receiptCurrency || receiptCurrency.trim() === '') {
      return NextResponse.json(
        { error: '請選擇幣別' },
        { status: 400 }
      );
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

    // 查詢所有相關主檔的 ID 和名稱（用於快取到審核表）
    
    // 查詢 Employee（Entity）
    let employeeId: string | null = null;
    let employeeName: string | null = null;
    if (employee) {
      const { data: empData } = await supabase
        .from('ns_entities_employees')
        .select('id, name')
        .eq('id', employee)
        .eq('is_inactive', false)
        .maybeSingle();
      
      if (empData) {
        employeeId = empData.id;
        employeeName = empData.name;
      } else {
        return NextResponse.json(
          { error: `找不到員工（ID: ${employee}），請確認員工是否正確或已同步到系統` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: '請選擇員工' },
        { status: 400 }
      );
    }

    // 查詢 Expense Category（必填）
    let expenseCategoryId: string | null = null;
    let expenseCategoryName: string | null = null;
    if (type) {
      const { data: categoryData } = await supabase
        .from('ns_expense_categories')
        .select('id, name')
        .eq('id', type)
        .eq('is_inactive', false)
        .maybeSingle();
      
      if (categoryData) {
        expenseCategoryId = categoryData.id;
        expenseCategoryName = categoryData.name;
      } else {
        return NextResponse.json(
          { error: `找不到費用類別（ID: ${type}），請確認費用類別是否正確或已同步到系統` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: '請選擇費用類別' },
        { status: 400 }
      );
    }

    // 查詢 Subsidiary（必填）
    let subsidiaryId: string | null = null;
    let subsidiaryName: string | null = null;
    if (subsidiary) {
      const { data: subData } = await supabase
        .from('ns_subsidiaries')
        .select('id, name')
        .eq('id', subsidiary)
        .eq('is_active', true)
        .maybeSingle();
      
      if (subData) {
        subsidiaryId = subData.id;
        subsidiaryName = subData.name;
      } else {
        return NextResponse.json(
          { error: `找不到公司別（ID: ${subsidiary}），請確認公司別是否正確或已同步到系統` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: '請選擇公司別' },
        { status: 400 }
      );
    }

    // 查詢 Location
    let locationId: string | null = null;
    let locationName: string | null = null;
    if (expenseLocation) {
      const { data: locData } = await supabase
        .from('ns_locations')
        .select('id, name')
        .eq('id', expenseLocation)
        .eq('is_inactive', false)
        .maybeSingle();
      
      if (locData) {
        locationId = locData.id;
        locationName = locData.name;
      }
    }

    // 查詢 Department
    let departmentId: string | null = null;
    let departmentName: string | null = null;
    if (department) {
      const { data: deptData } = await supabase
        .from('ns_departments')
        .select('id, name')
        .eq('id', department)
        .eq('is_inactive', false)
        .maybeSingle();
      
      if (deptData) {
        departmentId = deptData.id;
        departmentName = deptData.name;
      }
    }

    // 查詢 Class
    let classId: string | null = null;
    let className: string | null = null;
    if (classField) {
      const { data: classData } = await supabase
        .from('ns_classes')
        .select('id, name')
        .eq('id', classField)
        .eq('is_inactive', false)
        .maybeSingle();
      
      if (classData) {
        classId = classData.id;
        className = classData.name;
      }
    }

    // 查詢 Currency（必填）
    let currencyId: string | null = null;
    if (receiptCurrency) {
      const { data: currData } = await supabase
        .from('ns_currencies')
        .select('id, symbol, name')
        .or(`symbol.eq.${receiptCurrency},name.ilike.%${receiptCurrency}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      if (currData) {
        currencyId = currData.id;
      } else {
        return NextResponse.json(
          { error: `找不到幣別「${receiptCurrency}」，請確認幣別是否正確或已同步到系統` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: '請選擇幣別' },
        { status: 400 }
      );
    }

    // 取得使用者名稱（從 user metadata 或 email）
    const createdByName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || '未知使用者';

    // 轉換 invoiceDate 為 DATE 格式（如果有的話）
    let invoiceDateFormatted: Date | null = null;
    if (invoiceDate) {
      try {
        invoiceDateFormatted = new Date(invoiceDate);
        if (isNaN(invoiceDateFormatted.getTime())) {
          invoiceDateFormatted = null;
        }
      } catch (e) {
        invoiceDateFormatted = null;
      }
    }

    // 轉換 ocrProcessedAt 為 TIMESTAMPTZ（如果有的話）
    let ocrProcessedAtFormatted: Date | null = null;
    if (ocrProcessedAt) {
      try {
        ocrProcessedAtFormatted = new Date(ocrProcessedAt);
        if (isNaN(ocrProcessedAtFormatted.getTime())) {
          ocrProcessedAtFormatted = null;
        }
      } catch (e) {
        ocrProcessedAtFormatted = null;
      }
    }

    // 寫入 expense_reviews 表（審核表）
    const { data: reviewData, error: insertError } = await supabase
      .from('expense_reviews')
      .insert({
        // 基本報支資訊
        expense_date: expenseDate,
        expense_category_id: expenseCategoryId,
        expense_category_name: expenseCategoryName,
        employee_id: employeeId,
        employee_name: employeeName,
        subsidiary_id: subsidiaryId,
        subsidiary_name: subsidiaryName,
        location_id: locationId,
        location_name: locationName,
        department_id: departmentId,
        department_name: departmentName,
        class_id: classId,
        class_name: className,
        receipt_amount: parseFloat(receiptAmount),
        receipt_currency: receiptCurrency,
        currency_id: currencyId,
        description: description || null,
        receipt_missing: receiptMissing || false,
        
        // OCR 識別結果
        invoice_title: invoiceTitle || null,
        invoice_period: invoicePeriod || null,
        invoice_number: invoiceNumber || null,
        invoice_date: invoiceDateFormatted,
        random_code: randomCode || null,
        format_code: formatCode || null,
        seller_name: sellerName || null,
        seller_tax_id: sellerTaxId || null,
        seller_address: sellerAddress || null,
        buyer_name: buyerName || null,
        buyer_tax_id: buyerTaxId || null,
        buyer_address: buyerAddress || null,
        untaxed_amount: untaxedAmount ? parseFloat(untaxedAmount) : null,
        tax_amount: taxAmount ? parseFloat(taxAmount) : null,
        total_amount: totalAmount ? parseFloat(totalAmount) : null,
        
        // OCR 元數據
        ocr_success: ocrSuccess || false,
        ocr_confidence: ocrConfidence ? parseFloat(ocrConfidence.toString()) : null,
        ocr_document_type: ocrDocumentType || null,
        ocr_errors: ocrErrors || null,
        ocr_warnings: ocrWarnings || null,
        ocr_error_count: ocrErrorCount || 0,
        ocr_warning_count: ocrWarningCount || 0,
        ocr_quality_grade: ocrQualityGrade || null,
        ocr_file_name: ocrFileName || null,
        ocr_file_id: ocrFileId || null,
        ocr_web_view_link: ocrWebViewLink || null,
               ocr_processed_at: ocrProcessedAtFormatted,
               
               // 附件（優先使用 Storage URL，Base64 作為備用）
               attachment_url: attachment_url || null,
               attachment_base64: attachment || null,
               
               // 審核狀態（預設為待審核）
               review_status: 'pending',
        netsuite_sync_status: 'pending',
        
        // 建立人員資訊
        created_by: user.id,
        created_by_name: createdByName,
      })
      .select()
      .single();

    if (insertError) {
      console.error('寫入審核表錯誤:', insertError);
      return NextResponse.json(
        { 
          error: '寫入審核表失敗',
          message: insertError.message || '未知錯誤',
          details: insertError
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '報支項目已成功提交，等待財務人員審核',
      review_id: reviewData.id,
      review_status: 'pending',
      data: reviewData,
    });

  } catch (error: any) {
    console.error('創建 Expense Report 錯誤:', error);
    return NextResponse.json(
      { 
        error: '創建報支項目失敗',
        message: error.message || '未知錯誤',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

