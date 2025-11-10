import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Tax Code (salestaxitem) 的實際欄位結構
 * 檢查是否有 country 或 subsidiary 欄位
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();

    console.log('開始測試 Tax Code 欄位...');

    // 方法 1: 測試 salestaxitem 表是否有 country 欄位
    let suiteqlResult;
    let successfulTable = 'salestaxitem';
    
    try {
      // 先測試基本查詢（不包含 country）
      suiteqlResult = await netsuite.executeSuiteQL(`
        SELECT 
          id,
          itemid,
          fullname,
          rate,
          description,
          isinactive
        FROM salestaxitem
        WHERE ROWNUM <= 5
        ORDER BY id
      `);
      console.log('成功查詢 salestaxitem 表（基本欄位）');
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'salestaxitem 表基本查詢失敗',
          message: error.message,
        },
        { status: 500 }
      );
    }
    
    // 如果基本查詢成功，嘗試加入 country 欄位
    let hasCountry = false;
    let countryTestResult;
    try {
      countryTestResult = await netsuite.executeSuiteQL(`
        SELECT 
          id,
          itemid,
          country
        FROM salestaxitem
        WHERE ROWNUM <= 5
        ORDER BY id
      `);
      hasCountry = true;
      console.log('salestaxitem 表有 country 欄位');
    } catch (countryError: any) {
      console.log('salestaxitem 表沒有 country 欄位:', countryError.message);
      hasCountry = false;
    }

    const suiteqlItems = suiteqlResult.items || [];
    const countryItems = hasCountry && countryTestResult ? countryTestResult.items || [] : [];

    // 方法 2: 使用 REST API 取得詳細資料
    // 根據 NetSuite UI，Tax Codes 有明確的 Country 欄位，應該可以透過 REST API 取得
    let restApiItems: any[] = [];
    if (suiteqlItems.length > 0) {
      // 取得前 5 筆記錄的詳細資料，檢查是否有 country 相關資訊
      for (let i = 0; i < Math.min(5, suiteqlItems.length); i++) {
        try {
          const item = suiteqlItems[i];
          // 嘗試使用 salestaxitem 作為 record type
          const detail = await netsuite.getRecord('salestaxitem', item.id);
          
          // 分析所有欄位，找出可能包含 country 的欄位
          const allKeys = Object.keys(detail);
          const countryRelatedKeys = allKeys.filter(key => 
            key.toLowerCase().includes('country') ||
            key.toLowerCase().includes('nation') ||
            key.toLowerCase().includes('region')
          );
          
          // 檢查各種可能的 country 欄位名稱
          const countryValue = 
            detail.country || 
            detail.Country || 
            detail.COUNTRY ||
            detail.countryCode ||
            detail.countryCode ||
            detail.nation ||
            null;
          
          restApiItems.push({
            id: item.id,
            itemid: item.itemid,
            detail,
            allKeys: allKeys,
            countryRelatedKeys: countryRelatedKeys,
            // 檢查各種可能的 country 欄位
            hasCountry: 'country' in detail || 'Country' in detail || 'COUNTRY' in detail,
            countryValue: countryValue,
            // 檢查是否有 state/province 欄位
            hasState: 'state' in detail || 'State' in detail || 'taxState' in detail,
            stateValue: detail.state || detail.State || detail.taxState || null,
            // 檢查名稱中是否包含國家代碼（例如：VAT_TW, WET-AU）
            nameContainsCountry: item.itemid ? /[-_]([A-Z]{2})(?:[-_]|$)/.test(item.itemid) : false,
            namePattern: item.itemid,
          });
        } catch (restError: any) {
          console.warn(`REST API getRecord 失敗 (${item.id}):`, restError.message);
          restApiItems.push({
            id: item.id,
            itemid: item.itemid,
            error: restError.message,
          });
        }
      }
    }

    // 分析 SuiteQL 結果中的欄位
    const availableFields = suiteqlItems.length > 0 ? Object.keys(suiteqlItems[0]) : [];
    const countrySample = hasCountry && countryItems.length > 0 ? countryItems[0].country : null;

    return NextResponse.json({
      success: true,
      tableName: successfulTable,
      suiteqlItems: suiteqlItems.slice(0, 3), // 只返回前 3 筆作為範例
      suiteqlFieldAnalysis: availableFields,
      hasCountryInSuiteQL: hasCountry,
      countrySample: countrySample,
      countryTestItems: hasCountry ? countryItems.slice(0, 3) : null,
      restApiDetail: restApiItems.length > 0 ? restApiItems[0] : null,
      totalRecords: suiteqlItems.length,
    });
  } catch (error: any) {
    console.error('測試 Tax Code 欄位錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || error.toString(),
      },
      { status: 500 }
    );
  }
}

