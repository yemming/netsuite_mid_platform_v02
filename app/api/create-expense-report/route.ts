import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      expenseDate,
      type, // 費用科目
      employee, // 員工（Entity）
      subsidiary,
      expenseLocation,
      department,
      class: classField,
      receiptAmount,
      receiptCurrency,
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
      attachment,
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
      return NextResponse.json(
        { 
          error: `NetSuite 環境變數未設定: ${missingVars.join(', ')}` 
        },
        { status: 500 }
      );
    }

    const netsuite = getNetSuiteAPIClient();
    const supabase = await createClient();

    // 從 Supabase 查詢對應的 NetSuite ID
    // 假設前端傳來的值可能是名稱或 ID，我們需要查詢對應的 netsuite_internal_id
    
    // 查詢 Employee（Entity）
    let employeeId: string | null = null;
    if (employee) {
      try {
        const { data: empData, error: empError } = await supabase
          .from('ns_entities_employees')
          .select('netsuite_internal_id')
          .eq('id', employee)
          .eq('is_inactive', false)
          .maybeSingle();
        
        if (!empError && empData) {
          employeeId = empData.netsuite_internal_id?.toString() || null;
        }
        // 如果查不到，嘗試用名稱查詢
        if (!employeeId) {
          const { data: empDataByName } = await supabase
            .from('ns_entities_employees')
            .select('netsuite_internal_id')
            .ilike('name', `%${employee}%`)
            .eq('is_inactive', false)
            .limit(1)
            .maybeSingle();
          employeeId = empDataByName?.netsuite_internal_id?.toString() || employee;
        }
      } catch (e) {
        // 如果查詢失敗，假設傳來的值就是 NetSuite ID
        employeeId = employee;
      }
    }

    // 查詢 Subsidiary
    let subsidiaryId: string | null = null;
    if (subsidiary) {
      try {
        const { data: subData, error: subError } = await supabase
          .from('ns_subsidiaries')
          .select('netsuite_internal_id')
          .or(`id.eq.${subsidiary},name.ilike.%${subsidiary}%`)
          .eq('is_inactive', false)
          .limit(1)
          .maybeSingle();
        
        if (!subError && subData) {
          subsidiaryId = subData.netsuite_internal_id?.toString() || null;
        }
        // 如果查不到，假設傳來的值就是 NetSuite ID
        if (!subsidiaryId) {
          subsidiaryId = subsidiary;
        }
      } catch (e) {
        // 如果查詢失敗，假設傳來的值就是 NetSuite ID
        subsidiaryId = subsidiary;
      }
    }

    // 查詢 Department
    let departmentId: string | null = null;
    if (department) {
      try {
        const { data: deptData } = await supabase
          .from('ns_departments')
          .select('netsuite_internal_id')
          .or(`id.eq.${department},name.ilike.%${department}%`)
          .eq('is_inactive', false)
          .limit(1)
          .maybeSingle();
        departmentId = deptData?.netsuite_internal_id?.toString() || department;
      } catch (e) {
        departmentId = department;
      }
    }

    // 查詢 Class
    let classId: string | null = null;
    if (classField) {
      try {
        const { data: classData } = await supabase
          .from('ns_classes')
          .select('netsuite_internal_id')
          .or(`id.eq.${classField},name.ilike.%${classField}%`)
          .eq('is_inactive', false)
          .limit(1)
          .maybeSingle();
        classId = classData?.netsuite_internal_id?.toString() || classField;
      } catch (e) {
        classId = classField;
      }
    }

    // 查詢 Expense Category
    let categoryId: string | null = null;
    if (type) {
      try {
        const { data: categoryData } = await supabase
          .from('ns_expense_categories')
          .select('netsuite_internal_id')
          .or(`id.eq.${type},name.ilike.%${type}%`)
          .eq('is_inactive', false)
          .limit(1)
          .maybeSingle();
        categoryId = categoryData?.netsuite_internal_id?.toString() || type;
      } catch (e) {
        categoryId = type;
      }
    }

    // 查詢 Location（如果有的話）
    let locationId: string | null = null;
    if (expenseLocation) {
      try {
        const { data: locData } = await supabase
          .from('ns_locations')
          .select('netsuite_internal_id')
          .or(`id.eq.${expenseLocation},name.ilike.%${expenseLocation}%`)
          .eq('is_inactive', false)
          .limit(1)
          .maybeSingle();
        locationId = locData?.netsuite_internal_id?.toString() || expenseLocation;
      } catch (e) {
        locationId = expenseLocation;
      }
    }

    // 查詢 Currency
    let currencyId: string = '1'; // 預設
    if (receiptCurrency) {
      try {
        const { data: currData } = await supabase
          .from('ns_currencies')
          .select('netsuite_internal_id')
          .or(`id.eq.${receiptCurrency},symbol.eq.${receiptCurrency},name.ilike.%${receiptCurrency}%`)
          .eq('is_inactive', false)
          .limit(1)
          .maybeSingle();
        currencyId = currData?.netsuite_internal_id?.toString() || receiptCurrency || '1';
      } catch (e) {
        currencyId = receiptCurrency || '1';
      }
    }

    // 組裝 NetSuite Expense Report payload
    const expenseReportData: any = {
      recordType: 'expenseReport',
      entity: employeeId ? { id: employeeId } : undefined, // 員工（Entity）
      subsidiary: { id: subsidiaryId || subsidiary },
      currency: { id: currencyId },
      tranDate: expenseDate,
      // 以下欄位為可選（根據 NetSuite 實際需求）
      ...(departmentId && { department: { id: departmentId } }),
      ...(classId && { class: { id: classId } }),
      ...(locationId && { location: { id: locationId } }),
      memo: description || `OCR 辨識報支項目${invoiceNumber ? ` - 發票號碼: ${invoiceNumber}` : ''}`,
      expense: {
        items: [
          {
            category: { id: categoryId || type },
            amount: parseFloat(receiptAmount),
            memo: description || `發票: ${invoiceNumber || '無發票號碼'}`,
          }
        ]
      }
    };

    // 如果有 OCR 識別結果，添加到 memo
    if (invoiceNumber || invoiceTitle) {
      const ocrInfo = [];
      if (invoiceTitle) ocrInfo.push(`發票標題: ${invoiceTitle}`);
      if (invoiceNumber) ocrInfo.push(`發票號碼: ${invoiceNumber}`);
      if (invoiceDate) ocrInfo.push(`開立時間: ${invoiceDate}`);
      if (sellerName) ocrInfo.push(`賣方: ${sellerName}`);
      if (buyerName) ocrInfo.push(`買方: ${buyerName}`);
      
      expenseReportData.memo = `${expenseReportData.memo}\n\nOCR 識別資訊:\n${ocrInfo.join('\n')}`;
    }

    // 創建 Expense Report
    const netsuiteResult = await netsuite.createRecord('expensereport', expenseReportData);

    // 保存到 Supabase（記錄交易參考）
    // TODO: 如果有 transaction_references 表，可以記錄這裡
    // await supabase.from('transaction_references').insert({...});

    return NextResponse.json({
      success: true,
      message: '報支項目已成功建立',
      netsuite_id: netsuiteResult.id,
      netsuite_tran_id: netsuiteResult.tranId,
      data: netsuiteResult,
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

