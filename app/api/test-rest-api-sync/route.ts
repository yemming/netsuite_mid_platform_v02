import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 REST API 同步功能
 * 用於驗證三個無法用 SuiteQL 查詢的表：
 * 1. accountingperiod
 * 2. bom
 * 3. workcenter
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {};

    // 1. 測試 Accounting Period
    console.log('測試 Accounting Period REST API...');
    try {
      const accountingPeriodResult = await netsuite.getRecordList('accountingperiod', {
        fetchAll: false,
        limit: 5,
      });
      results.accountingPeriod = {
        success: true,
        count: accountingPeriodResult.items?.length || 0,
        sample: accountingPeriodResult.items?.[0] || null,
        message: '成功取得 Accounting Period 資料',
      };
    } catch (error: any) {
      results.accountingPeriod = {
        success: false,
        error: error.message,
        message: '取得 Accounting Period 資料失敗',
      };
    }

    // 2. 測試 BOM
    console.log('測試 BOM REST API...');
    try {
      const bomResult = await netsuite.getRecordList('bom', {
        fetchAll: false,
        limit: 5,
      });
      results.bom = {
        success: true,
        count: bomResult.items?.length || 0,
        sample: bomResult.items?.[0] || null,
        message: '成功取得 BOM 資料',
      };

      // 如果有 BOM，嘗試獲取一個詳細資訊
      if (bomResult.items && bomResult.items.length > 0) {
        try {
          const bomDetail = await netsuite.getRecord('bom', bomResult.items[0].id);
          results.bom.detail = bomDetail;
        } catch (detailError: any) {
          results.bom.detailError = detailError.message;
        }
      }
    } catch (error: any) {
      results.bom = {
        success: false,
        error: error.message,
        message: '取得 BOM 資料失敗',
      };
    }

    // 3. 測試 Work Center
    console.log('測試 Work Center REST API...');
    try {
      const workCenterResult = await netsuite.getRecordList('workcenter', {
        fetchAll: false,
        limit: 5,
      });
      results.workCenter = {
        success: true,
        count: workCenterResult.items?.length || 0,
        sample: workCenterResult.items?.[0] || null,
        message: '成功取得 Work Center 資料',
      };
    } catch (error: any) {
      results.workCenter = {
        success: false,
        error: error.message,
        message: '取得 Work Center 資料失敗',
      };
    }

    return NextResponse.json({
      success: true,
      message: 'REST API 測試完成',
      results,
    });
  } catch (error: any) {
    console.error('測試 REST API 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試 REST API 時發生錯誤',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '請使用 POST 方法測試 REST API',
    endpoint: '/api/test-rest-api-sync',
    method: 'POST',
  });
}

