import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試取得 Accounting Period 的詳細資料
 * 使用 getRecord 取得單一記錄的完整欄位
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();

    console.log('開始測試 Accounting Period getRecord...');

    // 先取得列表，然後用 getRecord 取得詳細資料
    let listResult;
    try {
      listResult = await netsuite.getRecordList('accountingperiod', {
        fetchAll: false,
        limit: 10,
      });
    } catch (listError: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'List API 失敗',
          message: listError.message,
        },
        { status: 500 }
      );
    }

    const items = listResult.items || [];
    
    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '無資料',
          message: 'NetSuite 中沒有找到任何 Accounting Period 資料',
        },
        { status: 404 }
      );
    }

    // 取得前 3 筆記錄的詳細資料
    const detailedRecords = [];
    for (let i = 0; i < Math.min(3, items.length); i++) {
      const item = items[i];
      const recordId = item.id;
      
      try {
        const detail = await netsuite.getRecord('accountingperiod', recordId);
        detailedRecords.push({
          id: recordId,
          detail,
          allKeys: Object.keys(detail),
        });
      } catch (error: any) {
        detailedRecords.push({
          id: recordId,
          error: error.message,
        });
      }
    }

    // 分析欄位
    const fieldAnalysis: Record<string, any> = {};
    if (detailedRecords.length > 0 && detailedRecords[0].detail) {
      const firstDetail = detailedRecords[0].detail;
      Object.keys(firstDetail).forEach(key => {
        fieldAnalysis[key] = {
          type: typeof firstDetail[key],
          value: firstDetail[key],
          isObject: typeof firstDetail[key] === 'object' && firstDetail[key] !== null,
        };
      });
    }

    return NextResponse.json({
      success: true,
      listCount: items.length,
      detailedRecords,
      fieldAnalysis,
      sampleListItems: items.slice(0, 3),
    });
  } catch (error: any) {
    console.error('測試 Accounting Period 詳細資料錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試 Accounting Period 詳細資料時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

