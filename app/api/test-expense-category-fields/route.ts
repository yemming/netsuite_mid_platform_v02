import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Expense Category 的實際欄位結構
 * 檢查是否有 subsidiary 欄位
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();

    console.log('開始測試 Expense Category 欄位...');

    // 方法 1: 使用 SuiteQL 查詢
    let suiteqlResult;
    try {
      suiteqlResult = await netsuite.executeSuiteQL(`
        SELECT id, name, expenseacct, subsidiary, isinactive
        FROM expensecategory
        WHERE isinactive = 'F'
        ORDER BY id
      `);
    } catch (suiteqlError: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'SuiteQL 查詢失敗',
          message: suiteqlError.message,
        },
        { status: 500 }
      );
    }

    const suiteqlItems = suiteqlResult.items || [];

    // 方法 2: 使用 REST API 取得詳細資料
    let restApiItems: any[] = [];
    if (suiteqlItems.length > 0) {
      // 取得第一筆記錄的詳細資料
      try {
        const firstItem = suiteqlItems[0];
        const detail = await netsuite.getRecord('expensecategory', firstItem.id);
        restApiItems.push({
          id: firstItem.id,
          detail,
          allKeys: Object.keys(detail),
        });
      } catch (restError: any) {
        console.warn('REST API getRecord 失敗:', restError.message);
      }
    }

    return NextResponse.json({
      success: true,
      suiteqlItems,
      suiteqlFieldAnalysis: suiteqlItems.length > 0 ? Object.keys(suiteqlItems[0]) : [],
      restApiDetail: restApiItems.length > 0 ? restApiItems[0] : null,
      hasSubsidiaryInSuiteQL: suiteqlItems.length > 0 && 'subsidiary' in suiteqlItems[0],
      subsidiarySample: suiteqlItems.length > 0 ? suiteqlItems[0].subsidiary : null,
    });
  } catch (error: any) {
    console.error('測試 Expense Category 欄位錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試 Expense Category 欄位時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

