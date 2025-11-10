import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 強制動態渲染，因為需要使用 cookies 進行認證
export const dynamic = 'force-dynamic';

/**
 * 取得報支表單所需的所有選項資料
 * 一次查詢 8 張表：員工、費用類別、公司別、地點、部門、類別、幣別、稅碼
 * 
 * Query Parameters:
 * - country: 可選，根據國家代碼篩選稅碼（例如：TW, US, CN）
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // 從 URL 參數取得 country（用於篩選稅碼）
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    // 並行查詢所有表（提升效能）
    const [
      employeesResult,
      expenseCategoriesResult,
      subsidiariesResult,
      locationsResult,
      departmentsResult,
      classesResult,
      currenciesResult,
      taxCodesResult,
    ] = await Promise.all([
      // 1. 員工
      supabase
        .from('ns_entities_employees')
        .select('id, name, netsuite_internal_id')
        .eq('is_inactive', false)
        .order('name'),
      
      // 2. 費用類別
      supabase
        .from('ns_expense_categories')
        .select('id, name, netsuite_internal_id')
        .eq('is_inactive', false)
        .order('name'),
      
      // 3. 公司別（包含 country 欄位，用於篩選稅碼）
      supabase
        .from('ns_subsidiaries')
        .select('id, name, netsuite_internal_id, country')
        .eq('is_active', true)
        .order('name'),
      
      // 4. 地點
      supabase
        .from('ns_locations')
        .select('id, name, netsuite_internal_id')
        .eq('is_inactive', false)
        .order('name'),
      
      // 5. 部門
      supabase
        .from('ns_departments')
        .select('id, name, netsuite_internal_id')
        .eq('is_inactive', false)
        .order('name'),
      
      // 6. 類別
      supabase
        .from('ns_classes')
        .select('id, name, netsuite_internal_id')
        .eq('is_inactive', false)
        .order('name'),
      
      // 7. 幣別
      supabase
        .from('ns_currencies')
        .select('id, name, symbol, netsuite_internal_id')
        .eq('is_active', true)
        .order('symbol'),
      
      // 8. 稅碼（根據 country 篩選，如果提供 country 參數）
      (() => {
        let query = supabase
          .from('ns_tax_codes')
          .select('id, name, rate, description, country, netsuite_internal_id')
          .eq('is_inactive', false);
        
        // 如果有 country 參數，根據 country 篩選
        if (country) {
          query = query.eq('country', country);
        }
        
        return query.order('name');
      })(),
    ]);

    // 檢查錯誤
    const errors: string[] = [];
    
    if (employeesResult.error) {
      console.error('載入員工列表錯誤:', employeesResult.error);
      errors.push(`員工: ${employeesResult.error.message}`);
    }
    
    if (expenseCategoriesResult.error) {
      console.error('載入費用類別列表錯誤:', expenseCategoriesResult.error);
      errors.push(`費用類別: ${expenseCategoriesResult.error.message}`);
    }
    
    if (subsidiariesResult.error) {
      console.error('載入公司別列表錯誤:', subsidiariesResult.error);
      errors.push(`公司別: ${subsidiariesResult.error.message}`);
    }
    
    if (locationsResult.error) {
      console.error('載入地點列表錯誤:', locationsResult.error);
      errors.push(`地點: ${locationsResult.error.message}`);
    }
    
    if (departmentsResult.error) {
      console.error('載入部門列表錯誤:', departmentsResult.error);
      errors.push(`部門: ${departmentsResult.error.message}`);
    }
    
    if (classesResult.error) {
      console.error('載入類別列表錯誤:', classesResult.error);
      errors.push(`類別: ${classesResult.error.message}`);
    }
    
    if (currenciesResult.error) {
      console.error('載入幣別列表錯誤:', currenciesResult.error);
      errors.push(`幣別: ${currenciesResult.error.message}`);
    }
    
    if (taxCodesResult.error) {
      console.error('載入稅碼列表錯誤:', taxCodesResult.error);
      errors.push(`稅碼: ${taxCodesResult.error.message}`);
    }

    // 如果有錯誤，但部分資料成功，仍然返回成功（但包含錯誤訊息）
    // 如果全部失敗，返回錯誤
    const hasAnyData = 
      (employeesResult.data && employeesResult.data.length > 0) ||
      (expenseCategoriesResult.data && expenseCategoriesResult.data.length > 0) ||
      (subsidiariesResult.data && subsidiariesResult.data.length > 0) ||
      (locationsResult.data && locationsResult.data.length > 0) ||
      (departmentsResult.data && departmentsResult.data.length > 0) ||
      (classesResult.data && classesResult.data.length > 0) ||
      (currenciesResult.data && currenciesResult.data.length > 0) ||
      (taxCodesResult.data && taxCodesResult.data.length > 0);

    if (errors.length > 0 && !hasAnyData) {
      return NextResponse.json(
        {
          success: false,
          error: '查詢失敗',
          errors: errors,
          message: '無法載入表單選項資料',
        },
        { status: 500 }
      );
    }

    // 返回統一的資料格式
    return NextResponse.json({
      success: true,
      data: {
        employees: employeesResult.data || [],
        expenseCategories: expenseCategoriesResult.data || [],
        subsidiaries: subsidiariesResult.data || [],
        locations: locationsResult.data || [],
        departments: departmentsResult.data || [],
        classes: classesResult.data || [],
        currencies: currenciesResult.data || [],
        taxCodes: taxCodesResult.data || [],
      },
      // 如果有部分錯誤，仍然返回資料，但包含警告
      warnings: errors.length > 0 ? errors : undefined,
      // 如果有 country 參數，在回應中標註
      filteredByCountry: country || null,
    });
  } catch (error: any) {
    console.error('取得報支表單選項錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '查詢失敗',
        message: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

