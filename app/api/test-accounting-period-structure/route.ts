import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Accounting Period 的實際資料結構
 * 用於查看 REST API 返回的實際欄位名稱
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();

    console.log('開始測試 Accounting Period REST API...');

    // 方法 1: 嘗試使用 List API
    let result;
    let method = '';
    try {
      result = await netsuite.getRecordList('accountingperiod', {
        fetchAll: false,
        limit: 5, // 只取前 5 筆測試
      });
      method = 'List API';
    } catch (listError: any) {
      console.warn('List API 失敗，嘗試使用 Search API:', listError.message);
      
      // 方法 2: 如果 List API 失敗，嘗試使用 Search API
      try {
        const searchBody = {
          basic: [],
        };

        const searchResult = await netsuite.request(
          '/services/rest/record/v1/accountingperiod/search',
          'POST',
          searchBody
        );

        result = {
          items: searchResult.items?.slice(0, 5) || [], // 只取前 5 筆
          count: searchResult.items?.length || 0,
          hasMore: searchResult.hasMore || false,
        };
        method = 'Search API';
      } catch (searchError: any) {
        return NextResponse.json(
          {
            success: false,
            error: '兩種 API 都失敗',
            listError: listError.message,
            searchError: searchError.message,
          },
          { status: 500 }
        );
      }
    }

    const items = result.items || [];
    
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

    // 分析第一筆資料的結構
    const firstItem = items[0];
    const allKeys = Object.keys(firstItem);
    
    // 分析所有資料的欄位
    const fieldAnalysis: Record<string, any> = {};
    allKeys.forEach(key => {
      const values = items.map((item: any) => item[key]).filter(v => v !== null && v !== undefined);
      fieldAnalysis[key] = {
        type: typeof firstItem[key],
        sampleValue: firstItem[key],
        nonNullCount: values.length,
        sampleValues: values.slice(0, 3),
      };
    });

    return NextResponse.json({
      success: true,
      method,
      totalItems: items.length,
      firstItem,
      allKeys,
      fieldAnalysis,
      allItems: items, // 返回所有測試資料
    });
  } catch (error: any) {
    console.error('測試 Accounting Period 結構錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試 Accounting Period 結構時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

