import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Tax_items 表的實際欄位結構
 * 根據 NetSuite Schema Browser，Tax_items 表有以下欄位：
 * - item_id (Primary Key)
 * - name
 * - description
 * - full_name
 * - rate
 * - isinactive
 * - parent_id
 * - tax_city
 * - tax_county
 * - tax_state
 * - tax_zipcode
 * - income_account_id
 * - item_extid
 * - vendor_id
 * - vendorname
 * - date_last_modified
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();

    console.log('開始測試 Tax_items 表...');

    // ⚠️ 注意：Tax_items 表在 SuiteQL 中無法直接查詢
    // Schema Browser 顯示的是 ODBC 視圖，不是 SuiteQL 表
    // 我們需要使用 REST API 來查詢 taxitem 記錄類型
    
    // 方法 1: 先從 salestaxitem 取得一些 ID（用於 REST API 查詢）
    let salestaxitemIds: any[] = [];
    try {
      const salestaxitemResult = await netsuite.executeSuiteQL(`
        SELECT id, itemid, rate, description
        FROM salestaxitem
        WHERE ROWNUM <= 10
        ORDER BY id
      `);
      salestaxitemIds = salestaxitemResult.items || [];
      console.log(`從 salestaxitem 取得 ${salestaxitemIds.length} 筆記錄`);
    } catch (error: any) {
      console.warn('無法從 salestaxitem 取得資料:', error.message);
    }

    // 方法 2: 使用 REST API 查詢 taxitem 記錄類型
    // 根據 Schema Browser，Tax_items 表有地理欄位：tax_city, tax_county, tax_state, tax_zipcode
    let restApiItems: any[] = [];
    
    if (salestaxitemIds.length > 0) {
      // 嘗試用 REST API 查詢這些 taxitem（最多查詢 5 筆）
      for (const item of salestaxitemIds.slice(0, 5)) {
        try {
          // 嘗試使用 taxitem 作為 record type
          const detail = await netsuite.getRecord('taxitem', item.id);
          
          // 分析所有欄位，找出可能的地理相關欄位
          const allKeys = Object.keys(detail);
          const geographicKeys = allKeys.filter(key => 
            key.toLowerCase().includes('city') ||
            key.toLowerCase().includes('county') ||
            key.toLowerCase().includes('state') ||
            key.toLowerCase().includes('zip') ||
            key.toLowerCase().includes('country') ||
            key.toLowerCase().includes('region') ||
            key.toLowerCase().includes('location')
          );
          
          restApiItems.push({
            id: item.id,
            itemid: item.itemid,
            suiteqlData: item, // 從 SuiteQL 取得的資料
            restApiDetail: detail,
            allKeys: allKeys,
            geographicKeys: geographicKeys,
            // 特別檢查 Schema Browser 中提到的欄位
            hasCountry: 'country' in detail,
            countryValue: detail.country || null,
            hasTaxState: 'taxState' in detail || 'tax_state' in detail,
            taxStateValue: detail.taxState || detail.tax_state || null,
            hasTaxCity: 'taxCity' in detail || 'tax_city' in detail,
            taxCityValue: detail.taxCity || detail.tax_city || null,
            hasTaxCounty: 'taxCounty' in detail || 'tax_county' in detail,
            taxCountyValue: detail.taxCounty || detail.tax_county || null,
            hasTaxZipcode: 'taxZipcode' in detail || 'tax_zipcode' in detail,
            taxZipcodeValue: detail.taxZipcode || detail.tax_zipcode || null,
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

    return NextResponse.json({
      success: true,
      suiteqlNote: 'Tax_items 表在 SuiteQL 中無法直接查詢（Schema Browser 顯示的是 ODBC 視圖）',
      salestaxitemSample: salestaxitemIds.slice(0, 3), // SuiteQL 查詢的 salestaxitem 範例
      restApiDetails: restApiItems,
      schemaBrowserInfo: {
        tableName: 'Tax_items',
        source: 'ODBC Schema Browser (https://www.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2016_1/odbc/record/tax_items.html)',
        availableFields: [
          'item_id (PK)',
          'name',
          'description',
          'full_name',
          'rate',
          'isinactive',
          'parent_id',
          'tax_city',
          'tax_county',
          'tax_state',
          'tax_zipcode',
          'income_account_id',
          'item_extid',
          'vendor_id',
          'vendorname',
          'date_last_modified',
        ],
        geographicFields: ['tax_city', 'tax_county', 'tax_state', 'tax_zipcode'],
        note: 'tax_state 是 2 個字元的州代碼（例如：CA, NY, TX），可能可以與 subsidiary 的 country 關聯。但需要透過 REST API 查詢 taxitem 記錄類型才能取得這些欄位。',
      },
      recommendation: {
        method: '使用 REST API 查詢 taxitem 記錄類型',
        note: '如果 REST API 有提供 tax_state 等地理欄位，可以建立一個 mapping 表將 state 對應到 country（例如：CA, NY, TX → US）',
      },
    });
  } catch (error: any) {
    console.error('測試 Tax_items 表錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

