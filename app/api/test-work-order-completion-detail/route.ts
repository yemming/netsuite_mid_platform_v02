import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Work Order Completion 的詳細欄位結構
 * 檢查是否支援工時記錄
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 1. 檢查 metadata schema
    try {
      const schema = await netsuite.request(
        '/services/rest/record/v1/metadata-catalog/workordercompletion',
        'GET'
      );
      results.metadataSchema = {
        success: true,
        schema: schema,
      };
    } catch (error: any) {
      results.metadataSchema = {
        success: false,
        error: error.message,
      };
    }

    // 2. 檢查是否有 Work Orders（如果有，可以測試建立 Work Order Completion）
    try {
      const workOrders = await netsuite.getRecordList('workorder', {
        fetchAll: false,
        limit: 3,
      });
      
      results.workOrders = {
        success: true,
        count: workOrders.items?.length || 0,
        items: workOrders.items || [],
      };

      // 如果有 Work Order，嘗試取得詳細資訊
      if (workOrders.items && workOrders.items.length > 0) {
        try {
          const woDetail = await netsuite.getRecord('workorder', workOrders.items[0].id);
          results.workOrderDetail = {
            fields: Object.keys(woDetail),
            sample: woDetail,
          };
        } catch (woError: any) {
          results.workOrderDetail = {
            error: woError.message,
          };
        }
      }
    } catch (error: any) {
      results.workOrders = {
        success: false,
        error: error.message,
      };
    }

    // 3. 檢查是否可以建立 Work Order Completion（測試 payload）
    // 先不實際建立，只檢查欄位結構

    return NextResponse.json({
      success: true,
      message: '測試完成',
      results,
    });
  } catch (error: any) {
    console.error('測試錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '請使用 POST 方法測試 Work Order Completion 詳細欄位',
    endpoint: '/api/test-work-order-completion-detail',
    method: 'POST',
  });
}

