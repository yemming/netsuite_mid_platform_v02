import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 取得報支項目（表頭 + 所有 lines）
 * GET /api/expense-reports/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const expenseReviewId = params.id;

    if (!expenseReviewId) {
      return NextResponse.json(
        { error: '請提供報支編號' },
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

    // 1. 取得表頭資料
    const { data: headerData, error: headerError } = await supabase
      .from('expense_reviews')
      .select('*')
      .eq('id', expenseReviewId)
      .single();

    if (headerError || !headerData) {
      return NextResponse.json(
        { error: '找不到報支項目' },
        { status: 404 }
      );
    }

    // 檢查權限：建立者或任何登入的使用者都可以查看（審核人員也需要查看）
    // 注意：編輯權限仍然由 PUT API 控制，這裡只允許查看

    // 2. 取得所有 lines 資料
    const { data: linesData, error: linesError } = await supabase
      .from('expense_lines')
      .select('*')
      .eq('expense_review_id', expenseReviewId)
      .order('line_number', { ascending: true });

    if (linesError) {
      console.error('取得 lines 錯誤:', linesError);
      return NextResponse.json(
        { error: '取得明細資料失敗', message: linesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        header: headerData,
        lines: linesData || [],
      },
    });

  } catch (error: any) {
    console.error('取得 Expense Report 錯誤:', error);
    return NextResponse.json(
      { 
        error: '取得報支項目失敗',
        message: error.message || '未知錯誤',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

/**
 * 更新報支項目（表頭 + 所有 lines）
 * PUT /api/expense-reports/[id]
 * 
 * 請求格式與 POST /api/create-expense-report 相同
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const expenseReviewId = params.id;
    const body = await request.json();
    const { header, lines, reviewStatus } = body;

    if (!expenseReviewId) {
      return NextResponse.json(
        { error: '請提供報支編號' },
        { status: 400 }
      );
    }

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

    // 檢查報支是否存在且使用者有權限
    const { data: existingReview, error: checkError } = await supabase
      .from('expense_reviews')
      .select('id, created_by, review_status')
      .eq('id', expenseReviewId)
      .single();

    if (checkError || !existingReview) {
      return NextResponse.json(
        { error: '找不到報支項目' },
        { status: 404 }
      );
    }

    if (existingReview.created_by !== user.id) {
      return NextResponse.json(
        { error: '您沒有權限編輯此報支項目' },
        { status: 403 }
      );
    }

    // 只能編輯草稿或待審核的報支
    if (existingReview.review_status !== 'draft' && existingReview.review_status !== 'pending') {
      return NextResponse.json(
        { error: '只能編輯草稿或待審核的報支項目' },
        { status: 400 }
      );
    }

    // 查詢 Employee 和 Subsidiary（與 POST 相同邏輯）
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

    // 1. 更新表頭（如果提供了 reviewStatus，也更新狀態）
    const updateData: any = {
      expense_date: expenseDate,
      employee_id: employeeId,
      employee_name: employeeName,
      subsidiary_id: subsidiaryId,
      subsidiary_name: subsidiaryName,
      description: description || null,
      use_multi_currency: useMultiCurrency || false, // 使用多幣別
      updated_at: new Date().toISOString(),
    };
    
    // 如果提供了 reviewStatus，更新狀態（允許從 draft 改為 pending）
    if (reviewStatus) {
      const status = reviewStatus === 'pending' ? 'pending' : 'draft';
      updateData.review_status = status;
    }
    
    const { error: updateHeaderError } = await supabase
      .from('expense_reviews')
      .update(updateData)
      .eq('id', expenseReviewId);

    if (updateHeaderError) {
      console.error('更新表頭錯誤:', updateHeaderError);
      return NextResponse.json(
        { 
          error: '更新表頭失敗',
          message: updateHeaderError.message || '未知錯誤',
          details: updateHeaderError
        },
        { status: 500 }
      );
    }

    // 2. 刪除所有現有的 lines
    const { error: deleteLinesError } = await supabase
      .from('expense_lines')
      .delete()
      .eq('expense_review_id', expenseReviewId);

    if (deleteLinesError) {
      console.error('刪除現有 lines 錯誤:', deleteLinesError);
      return NextResponse.json(
        { 
          error: '刪除現有明細失敗',
          message: deleteLinesError.message || '未知錯誤',
        },
        { status: 500 }
      );
    }

    // 3. 準備並插入新的 lines（與 POST 相同的邏輯）
    const linesToInsert = await Promise.all(
      lines.map(async (line: any, index: number) => {
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

        // 查詢 Category
        let categoryId: string | null = null;
        let categoryName: string | null = null;
        if (category) {
          const { data: catData } = await supabase
            .from('ns_expense_categories')
            .select('id, name')
            .eq('id', category)
            .eq('is_inactive', false)
            .maybeSingle();
          
          if (catData) {
            categoryId = catData.id;
            categoryName = catData.name;
          } else {
            throw new Error(`第 ${index + 1} 筆明細找不到費用類別（ID: ${category}）`);
          }
        }

        // 查詢 Currency（支援 UUID 或符號）
        let currencyId: string | null = null;
        let currencySymbol: string | null = null;
        if (currency) {
          // 判斷是 UUID 還是符號
          const isUUID = currency.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
          
          let currData: any = null;
          if (isUUID) {
            // 如果是 UUID，直接用 ID 查詢
            const { data } = await supabase
              .from('ns_currencies')
              .select('id, symbol, name')
              .eq('id', currency)
              .eq('is_active', true)
              .maybeSingle();
            currData = data;
          } else {
            // 如果是符號，用 symbol 查詢
            const { data } = await supabase
              .from('ns_currencies')
              .select('id, symbol, name')
              .eq('symbol', currency)
              .eq('is_active', true)
              .maybeSingle();
            currData = data;
          }
          
          if (currData) {
            currencyId = currData.id;
            currencySymbol = currData.symbol;
          } else {
            throw new Error(`第 ${index + 1} 筆明細找不到幣別（${currency}），請確認幣別是否正確或已同步到系統`);
          }
        }

        // 查詢 Department（可選）
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

        // 查詢 Class（可選）
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

        // 查詢 Location（可選）
        let locationId: string | null = null;
        let locationName: string | null = null;
        if (location) {
          const { data: locData } = await supabase
            .from('ns_locations')
            .select('id, name')
            .eq('id', location)
            .eq('is_inactive', false)
            .maybeSingle();
          
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
          currency: currencySymbol,
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
      })
    );

    // 4. 插入新的 lines
    const { data: linesData, error: insertLinesError } = await supabase
      .from('expense_lines')
      .insert(linesToInsert)
      .select();

    if (insertLinesError) {
      console.error('插入新 lines 錯誤:', insertLinesError);
      return NextResponse.json(
        { 
          error: '更新明細失敗',
          message: insertLinesError.message || '未知錯誤',
          details: insertLinesError
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '報支項目已成功更新',
      expense_review_id: expenseReviewId,
      lines_count: linesData?.length || 0,
      data: {
        header: existingReview,
        lines: linesData,
      },
    });

  } catch (error: any) {
    console.error('更新 Expense Report 錯誤:', error);
    return NextResponse.json(
      { 
        error: '更新報支項目失敗',
        message: error.message || '未知錯誤',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

/**
 * 刪除報支項目
 * DELETE /api/expense-reports/[id]
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const expenseReviewId = params.id;

    if (!expenseReviewId) {
      return NextResponse.json(
        { error: '請提供報支編號' },
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

    // 檢查報支是否存在且使用者有權限
    const { data: existingReview, error: checkError } = await supabase
      .from('expense_reviews')
      .select('id, created_by, review_status')
      .eq('id', expenseReviewId)
      .single();

    if (checkError || !existingReview) {
      return NextResponse.json(
        { error: '找不到報支項目' },
        { status: 404 }
      );
    }

    if (existingReview.created_by !== user.id) {
      return NextResponse.json(
        { error: '您沒有權限刪除此報支項目' },
        { status: 403 }
      );
    }

    // 只能刪除草稿或待審核的報支
    if (existingReview.review_status !== 'draft' && existingReview.review_status !== 'pending') {
      return NextResponse.json(
        { error: '只能刪除草稿或待審核的報支項目' },
        { status: 400 }
      );
    }

    // 刪除報支（由於有 ON DELETE CASCADE，expense_lines 會自動刪除）
    const { error: deleteError } = await supabase
      .from('expense_reviews')
      .delete()
      .eq('id', expenseReviewId);

    if (deleteError) {
      console.error('刪除報支項目錯誤:', deleteError);
      return NextResponse.json(
        { 
          error: '刪除報支項目失敗',
          message: deleteError.message || '未知錯誤',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '報支項目已成功刪除',
    });

  } catch (error: any) {
    console.error('刪除 Expense Report 錯誤:', error);
    return NextResponse.json(
      { 
        error: '刪除報支項目失敗',
        message: error.message || '未知錯誤',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

/**
 * 提交報支項目（將狀態從 draft 改為 pending）
 * PATCH /api/expense-reports/[id]
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const expenseReviewId = params.id;

    if (!expenseReviewId) {
      return NextResponse.json(
        { error: '請提供報支編號' },
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

    // 檢查報支是否存在且使用者有權限
    const { data: existingReview, error: checkError } = await supabase
      .from('expense_reviews')
      .select('id, created_by, review_status')
      .eq('id', expenseReviewId)
      .single();

    if (checkError || !existingReview) {
      return NextResponse.json(
        { error: '找不到報支項目' },
        { status: 404 }
      );
    }

    if (existingReview.created_by !== user.id) {
      return NextResponse.json(
        { error: '您沒有權限提交此報支項目' },
        { status: 403 }
      );
    }

    // 只能提交草稿狀態的報支
    if (existingReview.review_status !== 'draft') {
      return NextResponse.json(
        { error: '只能提交草稿狀態的報支項目' },
        { status: 400 }
      );
    }

    // 取得報支日期以生成編號
    const { data: reviewData } = await supabase
      .from('expense_reviews')
      .select('expense_date, expense_report_number')
      .eq('id', expenseReviewId)
      .single();

    // 如果還沒有編號，在提交時生成費用報告編號
    let expenseReportNumber: string | null = reviewData?.expense_report_number || null;
    if (!expenseReportNumber && reviewData?.expense_date) {
      // 生成費用報告編號：EXP-YYYYMMDD-XXXXX
      const expenseDate = reviewData.expense_date;
      const [year, month, day] = expenseDate.split('-');
      if (year && month && day) {
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
    }

    // 更新狀態為 pending，並設定編號（如果有的話）
    const updateData: any = {
      review_status: 'pending',
      updated_at: new Date().toISOString(),
    };
    
    if (expenseReportNumber) {
      updateData.expense_report_number = expenseReportNumber;
    }

    const { error: updateError } = await supabase
      .from('expense_reviews')
      .update(updateData)
      .eq('id', expenseReviewId);

    if (updateError) {
      console.error('提交報支項目錯誤:', updateError);
      return NextResponse.json(
        { 
          error: '提交報支項目失敗',
          message: updateError.message || '未知錯誤',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '報支項目已成功提交',
    });

  } catch (error: any) {
    console.error('提交 Expense Report 錯誤:', error);
    return NextResponse.json(
      { 
        error: '提交報支項目失敗',
        message: error.message || '未知錯誤',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
