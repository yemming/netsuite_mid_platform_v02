import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 更新報支審核資料
 * 說明：讓財務人員可以修改報支資料
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { review_id, ...updateData } = body;

    if (!review_id) {
      return NextResponse.json(
        { error: '請提供報支審核 ID' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 檢查報支是否存在
    const { data: existingReview, error: checkError } = await supabase
      .from('expense_reviews')
      .select('id, review_status')
      .eq('id', review_id)
      .single();

    if (checkError || !existingReview) {
      return NextResponse.json(
        { error: '找不到報支審核資料', details: checkError?.message },
        { status: 404 }
      );
    }

    // 如果已經同步到 NetSuite，不允許修改（除非是審核狀態）
    if (existingReview.review_status === 'approved' && updateData.netsuite_sync_status === 'success') {
      return NextResponse.json(
        { error: '此報支已同步到 NetSuite，無法修改。如需修改，請先取消同步。' },
        { status: 400 }
      );
    }

    // 如果修改了關鍵欄位，需要重置同步狀態
    const criticalFields = [
      'expense_date',
      'expense_category_id',
      'employee_id',
      'subsidiary_id',
      'receipt_amount',
      'currency_id',
    ];

    const hasCriticalChanges = criticalFields.some(field => updateData[field] !== undefined);
    
    if (hasCriticalChanges && existingReview.review_status === 'approved') {
      // 如果修改了關鍵欄位且已審核通過，重置同步狀態
      updateData.netsuite_sync_status = 'pending';
      updateData.netsuite_internal_id = null;
      updateData.netsuite_tran_id = null;
      updateData.netsuite_sync_error = null;
      updateData.netsuite_url = null;
    }

    // 如果修改了員工、公司別、費用類別、幣別，需要重新查詢名稱
    if (updateData.employee_id) {
      const { data: employee } = await supabase
        .from('ns_entities_employees')
        .select('name')
        .eq('id', updateData.employee_id)
        .maybeSingle();
      if (employee) {
        updateData.employee_name = employee.name;
      }
    }

    if (updateData.subsidiary_id) {
      const { data: subsidiary } = await supabase
        .from('ns_subsidiaries')
        .select('name')
        .eq('id', updateData.subsidiary_id)
        .maybeSingle();
      if (subsidiary) {
        updateData.subsidiary_name = subsidiary.name;
      }
    }

    if (updateData.expense_category_id) {
      const { data: category } = await supabase
        .from('ns_expense_categories')
        .select('name')
        .eq('id', updateData.expense_category_id)
        .maybeSingle();
      if (category) {
        updateData.expense_category_name = category.name;
      }
    }

    if (updateData.currency_id) {
      const { data: currency } = await supabase
        .from('ns_currencies')
        .select('symbol')
        .eq('id', updateData.currency_id)
        .maybeSingle();
      if (currency) {
        updateData.receipt_currency = currency.symbol;
      }
    }

    if (updateData.department_id) {
      const { data: department } = await supabase
        .from('ns_departments')
        .select('name')
        .eq('id', updateData.department_id)
        .maybeSingle();
      if (department) {
        updateData.department_name = department.name;
      }
    }

    if (updateData.location_id) {
      const { data: location } = await supabase
        .from('ns_locations')
        .select('name')
        .eq('id', updateData.location_id)
        .maybeSingle();
      if (location) {
        updateData.location_name = location.name;
      }
    }

    if (updateData.class_id) {
      const { data: classData } = await supabase
        .from('ns_classes')
        .select('name')
        .eq('id', updateData.class_id)
        .maybeSingle();
      if (classData) {
        updateData.class_name = classData.name;
      }
    }

    // 更新資料
    const { data: updatedReview, error: updateError } = await supabase
      .from('expense_reviews')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', review_id)
      .select()
      .single();

    if (updateError) {
      console.error('更新報支審核資料錯誤:', updateError);
      return NextResponse.json(
        { error: '更新失敗', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '報支資料已更新',
      data: updatedReview,
    });
  } catch (error: any) {
    console.error('更新報支審核資料錯誤:', error);
    return NextResponse.json(
      {
        error: '更新失敗',
        message: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

