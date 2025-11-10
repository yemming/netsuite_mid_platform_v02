import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 taxtype 和 salestaxitem 的 JOIN 查詢
 * 根據用戶說明，稅碼是從這兩張表 join 出來的
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();

    console.log('開始測試 taxtype 和 salestaxitem JOIN...');

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // 測試 1: 查詢 taxtype 表結構
    console.log('測試 1: 查詢 taxtype 表...');
    try {
      const taxtypeResult = await netsuite.executeSuiteQL(`
        SELECT 
          id,
          name,
          description,
          country,
          isinactive
        FROM taxtype
        WHERE ROWNUM <= 5
        ORDER BY id
      `);
      results.taxtype = {
        success: true,
        count: taxtypeResult.items?.length || 0,
        sample: taxtypeResult.items?.[0] || null,
        allKeys: taxtypeResult.items?.[0] ? Object.keys(taxtypeResult.items[0]) : [],
      };
    } catch (error: any) {
      results.taxtype = {
        success: false,
        error: error.message,
      };
    }

    // 測試 2: 查詢 salestaxitem 表結構
    console.log('測試 2: 查詢 salestaxitem 表...');
    try {
      const salestaxitemResult = await netsuite.executeSuiteQL(`
        SELECT 
          id,
          itemid,
          fullname,
          rate,
          description,
          taxtype,
          isinactive
        FROM salestaxitem
        WHERE ROWNUM <= 5
        ORDER BY id
      `);
      results.salestaxitem = {
        success: true,
        count: salestaxitemResult.items?.length || 0,
        sample: salestaxitemResult.items?.[0] || null,
        allKeys: salestaxitemResult.items?.[0] ? Object.keys(salestaxitemResult.items[0]) : [],
      };
    } catch (error: any) {
      results.salestaxitem = {
        success: false,
        error: error.message,
      };
    }

    // 測試 3: JOIN 查詢
    console.log('測試 3: JOIN taxtype 和 salestaxitem...');
    try {
      const joinResult = await netsuite.executeSuiteQL(`
        SELECT 
          st.id,
          st.itemid,
          st.fullname,
          st.rate,
          st.description,
          st.taxtype,
          st.isinactive,
          tt.id as taxtype_id,
          tt.name as taxtype_name,
          tt.country,
          tt.description as taxtype_description
        FROM salestaxitem st
        LEFT JOIN taxtype tt ON st.taxtype = tt.id
        WHERE ROWNUM <= 20
        ORDER BY st.id
      `);
      
      // 分析結果，找出有 country 的記錄
      const itemsWithCountry = joinResult.items?.filter((item: any) => item.country) || [];
      const itemsWithoutCountry = joinResult.items?.filter((item: any) => !item.country) || [];
      
      results.join = {
        success: true,
        count: joinResult.items?.length || 0,
        withCountry: itemsWithCountry.length,
        withoutCountry: itemsWithoutCountry.length,
        samples: joinResult.items?.slice(0, 5) || [],
        samplesWithCountry: itemsWithCountry.slice(0, 3) || [],
        samplesWithoutCountry: itemsWithoutCountry.slice(0, 3) || [],
        allKeys: joinResult.items?.[0] ? Object.keys(joinResult.items[0]) : [],
      };
    } catch (error: any) {
      results.join = {
        success: false,
        error: error.message,
      };
    }

    return NextResponse.json({
      success: true,
      results: results,
    });
  } catch (error: any) {
    console.error('測試 taxtype JOIN 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

