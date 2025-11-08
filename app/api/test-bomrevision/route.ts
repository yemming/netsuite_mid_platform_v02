import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 bomrevision record type
 * 根據 metadata catalog，bomrevision 可能存在
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 方法 1: 嘗試直接 List API
    console.log('測試 bomrevision List API...');
    try {
      const listResult = await netsuite.getRecordList('bomrevision', {
        fetchAll: false,
        limit: 5,
      });
      
      results.list = {
        success: true,
        count: listResult.items?.length || 0,
        sample: listResult.items?.[0] || null,
        message: '✅ bomrevision List API 成功',
      };

      // 如果有資料，嘗試取得一個詳細資訊
      if (listResult.items && listResult.items.length > 0) {
        try {
          const detail = await netsuite.getRecord('bomrevision', listResult.items[0].id);
          results.detail = {
            success: true,
            fields: Object.keys(detail),
            sample: detail,
          };
        } catch (detailError: any) {
          results.detail = {
            success: false,
            error: detailError.message,
          };
        }
      }
    } catch (error: any) {
      results.list = {
        success: false,
        error: error.message,
        message: '❌ bomrevision List API 失敗',
      };
    }

    // 方法 2: 檢查 assemblyitem，看看是否有 bomrevision 相關欄位
    console.log('檢查 assemblyitem 是否有 bomrevision 相關欄位...');
    try {
      const assemblyItems = await netsuite.getRecordList('assemblyitem', {
        fetchAll: false,
        limit: 3,
      });

      if (assemblyItems.items && assemblyItems.items.length > 0) {
        const firstItemDetail = await netsuite.getRecord('assemblyitem', assemblyItems.items[0].id);
        
        results.assemblyItem = {
          success: true,
          itemId: assemblyItems.items[0].id,
          fields: Object.keys(firstItemDetail),
          bom_related_fields: Object.keys(firstItemDetail).filter((key: string) => 
            key.toLowerCase().includes('bom') || 
            key.toLowerCase().includes('revision') ||
            key.toLowerCase().includes('bill')
          ),
          sample: firstItemDetail,
        };
      } else {
        results.assemblyItem = {
          success: false,
          message: '沒有找到 Assembly Items',
        };
      }
    } catch (error: any) {
      results.assemblyItem = {
        success: false,
        error: error.message,
      };
    }

    return NextResponse.json({
      success: results.list?.success || false,
      message: results.list?.success 
        ? '成功找到 bomrevision 資料'
        : '無法取得 bomrevision 資料',
      results,
    });
  } catch (error: any) {
    console.error('測試 bomrevision 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試 bomrevision 時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '請使用 POST 方法測試 bomrevision',
    endpoint: '/api/test-bomrevision',
    method: 'POST',
  });
}

