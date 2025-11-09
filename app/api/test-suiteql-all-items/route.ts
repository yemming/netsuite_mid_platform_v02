import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試使用 SuiteQL 查詢所有 items（包含價格）
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 測試 1: 查詢所有 items（不包含價格）
    try {
      const query1 = await netsuite.executeSuiteQL(`
        SELECT id, itemid, displayname, itemtype, isinactive
        FROM item
        ORDER BY id
      `);
      
      results.suiteqlAllItems = {
        success: true,
        count: query1.items?.length || 0,
        items: query1.items || [],
        message: 'SuiteQL 查詢所有 items（不含價格）',
      };
    } catch (error: any) {
      results.suiteqlAllItems = {
        success: false,
        error: error.message || error.toString(),
      };
    }

    // 測試 2: 查詢 items 並嘗試取得價格（從 itemprice 表）
    try {
      const query2 = await netsuite.executeSuiteQL(`
        SELECT 
          i.id,
          i.itemid,
          i.displayname,
          i.itemtype,
          i.isinactive,
          ip.price as baseprice
        FROM item i
        LEFT JOIN itemprice ip ON i.id = ip.item AND ip.pricelevel = 1
        ORDER BY i.id
      `);
      
      results.suiteqlWithPrice = {
        success: true,
        count: query2.items?.length || 0,
        items: query2.items?.slice(0, 10) || [], // 只顯示前 10 筆
        message: 'SuiteQL 查詢 items 含價格（從 itemprice 表）',
      };
    } catch (error: any) {
      results.suiteqlWithPrice = {
        success: false,
        error: error.message || error.toString(),
      };
    }

    // 測試 3: 檢查 itemprice 表結構
    try {
      const query3 = await netsuite.executeSuiteQL(`
        SELECT *
        FROM itemprice
        WHERE ROWNUM <= 5
      `);
      
      results.itempriceTable = {
        success: true,
        count: query3.items?.length || 0,
        sample: query3.items || [],
        message: 'itemprice 表示範資料',
      };
    } catch (error: any) {
      results.itempriceTable = {
        success: false,
        error: error.message || error.toString(),
      };
    }

    return NextResponse.json({
      success: true,
      message: 'SuiteQL Items 查詢測試完成',
      results,
    });
  } catch (error: any) {
    console.error('測試 SuiteQL Items 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試時發生錯誤',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

