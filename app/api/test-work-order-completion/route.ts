import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Work Order Completion 的欄位結構
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

    // 2. 嘗試查詢現有的 Work Order Completion（如果有的話）
    try {
      const completionList = await netsuite.getRecordList('workordercompletion', {
        fetchAll: false,
        limit: 3,
      });
      
      results.completionList = {
        success: true,
        count: completionList.items?.length || 0,
        items: completionList.items || [],
      };

      // 如果有資料，取得詳細資訊
      if (completionList.items && completionList.items.length > 0) {
        try {
          const firstCompletion = await netsuite.getRecord(
            'workordercompletion',
            completionList.items[0].id
          );
          
          results.completionDetail = {
            success: true,
            fields: Object.keys(firstCompletion),
            fullStructure: firstCompletion,
            // 檢查是否有工時相關欄位
            timeRelatedFields: Object.keys(firstCompletion).filter(field =>
              field.toLowerCase().includes('time') ||
              field.toLowerCase().includes('hour') ||
              field.toLowerCase().includes('labor') ||
              field.toLowerCase().includes('machine')
            ),
          };
        } catch (detailError: any) {
          results.completionDetail = {
            success: false,
            error: detailError.message,
          };
        }
      }
    } catch (error: any) {
      results.completionList = {
        success: false,
        error: error.message,
      };
    }

    // 3. 檢查 Time Bill
    try {
      const timeBillSchema = await netsuite.request(
        '/services/rest/record/v1/metadata-catalog/timebill',
        'GET'
      );
      results.timeBillSchema = {
        success: true,
        schema: timeBillSchema,
      };
    } catch (error: any) {
      results.timeBillSchema = {
        success: false,
        error: error.message,
      };
    }

    // 4. 嘗試查詢現有的 Time Bill（如果有的話）
    try {
      const timeBillList = await netsuite.getRecordList('timebill', {
        fetchAll: false,
        limit: 3,
      });
      
      results.timeBillList = {
        success: true,
        count: timeBillList.items?.length || 0,
        items: timeBillList.items || [],
      };

      // 如果有資料，取得詳細資訊
      if (timeBillList.items && timeBillList.items.length > 0) {
        try {
          const firstTimeBill = await netsuite.getRecord(
            'timebill',
            timeBillList.items[0].id
          );
          
          results.timeBillDetail = {
            success: true,
            fields: Object.keys(firstTimeBill),
            fullStructure: firstTimeBill,
            // 檢查是否有 Work Order 相關欄位
            workOrderFields: Object.keys(firstTimeBill).filter(field =>
              field.toLowerCase().includes('workorder') ||
              field.toLowerCase().includes('work_order') ||
              field.toLowerCase().includes('manufacturing')
            ),
          };
        } catch (detailError: any) {
          results.timeBillDetail = {
            success: false,
            error: detailError.message,
          };
        }
      }
    } catch (error: any) {
      results.timeBillList = {
        success: false,
        error: error.message,
      };
    }

    // 5. 檢查是否可以建立 Manufacturing Routing
    // 這需要實際測試建立，但先檢查 metadata

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
    message: '請使用 POST 方法測試 Work Order Completion 和 Time Bill',
    endpoint: '/api/test-work-order-completion',
    method: 'POST',
  });
}

