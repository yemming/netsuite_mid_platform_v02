import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Item Search API
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // 測試 inventoryitem 的 Search API
    console.log('測試 inventoryitem Search API...');
    try {
      const searchBody = {
        basic: [], // 空查詢 = 查詢所有記錄
      };

      const searchResult = await netsuite.request(
        '/services/rest/record/v1/inventoryitem/search',
        'POST',
        searchBody
      );

      results.inventoryitem = {
        success: true,
        count: searchResult.items?.length || 0,
        hasMore: searchResult.hasMore || false,
        sample: searchResult.items?.[0] || null,
        message: 'Search API 成功',
      };
    } catch (error: any) {
      results.inventoryitem = {
        success: false,
        error: error.message || error.toString(),
        message: 'Search API 失敗',
      };
    }

    // 測試不同的 Search Body 格式
    console.log('測試不同的 Search Body 格式...');
    
    // 格式 1: 完全空的 body
    try {
      const searchResult1 = await netsuite.request(
        '/services/rest/record/v1/inventoryitem/search',
        'POST',
        {}
      );
      results.format1_empty = {
        success: true,
        count: searchResult1.items?.length || 0,
        message: '格式 1（完全空的 body）成功',
      };
    } catch (error: any) {
      results.format1_empty = {
        success: false,
        error: error.message || error.toString(),
        message: '格式 1 失敗',
      };
    }

    // 格式 2: 使用 criteria
    try {
      const searchResult2 = await netsuite.request(
        '/services/rest/record/v1/inventoryitem/search',
        'POST',
        {
          criteria: {
            basic: [],
          },
        }
      );
      results.format2_criteria = {
        success: true,
        count: searchResult2.items?.length || 0,
        message: '格式 2（使用 criteria）成功',
      };
    } catch (error: any) {
      results.format2_criteria = {
        success: false,
        error: error.message || error.toString(),
        message: '格式 2 失敗',
      };
    }

    // 格式 3: 使用 columns
    try {
      const searchResult3 = await netsuite.request(
        '/services/rest/record/v1/inventoryitem/search',
        'POST',
        {
          basic: [],
          columns: {
            basic: [],
          },
        },
      );
      results.format3_columns = {
        success: true,
        count: searchResult3.items?.length || 0,
        message: '格式 3（使用 columns）成功',
      };
    } catch (error: any) {
      results.format3_columns = {
        success: false,
        error: error.message || error.toString(),
        message: '格式 3 失敗',
      };
    }

    return NextResponse.json({
      success: true,
      message: '測試完成',
      results,
    });
  } catch (error: any) {
    console.error('測試 Item Search API 錯誤:', error);
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

