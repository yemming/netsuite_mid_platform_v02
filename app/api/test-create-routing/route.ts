import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試是否可以建立 Manufacturing Routing
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 1. 先檢查 metadata schema，了解建立 Routing 需要的欄位
    try {
      const schema = await netsuite.request(
        '/services/rest/record/v1/metadata-catalog/manufacturingrouting',
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

    // 2. 嘗試建立一個測試 Routing（使用最小的必填欄位）
    try {
      // 根據已知的 Routing 結構，建立一個測試 Routing
      const testRoutingPayload = {
        name: `TEST-ROUTING-${Date.now()}`,
        billOfMaterials: { id: "1" },  // 使用 AAA BOM
        location: { id: "4" },  // 從現有 Routing 中取得
        subsidiary: { id: "11" },  // HEADQUARTERS
        isInactive: false,
      };

      const createResult = await netsuite.request(
        '/services/rest/record/v1/manufacturingrouting',
        'POST',
        testRoutingPayload
      );

      results.createRouting = {
        success: true,
        createdId: createResult.id,
        data: createResult,
      };

      // 如果建立成功，嘗試刪除（避免留下測試資料）
      if (createResult.id) {
        try {
          await netsuite.request(
            `/services/rest/record/v1/manufacturingrouting/${createResult.id}`,
            'DELETE'
          );
          results.cleanup = {
            success: true,
            message: '測試 Routing 已刪除',
          };
        } catch (deleteError: any) {
          results.cleanup = {
            success: false,
            error: deleteError.message,
            note: '測試 Routing 未刪除，請手動刪除',
          };
        }
      }
    } catch (error: any) {
      results.createRouting = {
        success: false,
        error: error.message,
        note: '可能不支援建立，或需要更多必填欄位',
      };
    }

    // 3. 嘗試更新現有的 Routing（測試是否可以更新）
    try {
      const updatePayload = {
        memo: `測試更新 ${Date.now()}`,
      };

      const updateResult = await netsuite.request(
        '/services/rest/record/v1/manufacturingrouting/1',
        'PATCH',
        updatePayload
      );

      results.updateRouting = {
        success: true,
        data: updateResult,
      };
    } catch (error: any) {
      results.updateRouting = {
        success: false,
        error: error.message,
        note: '可能不支援更新，或需要完整欄位',
      };
    }

    return NextResponse.json({
      success: results.createRouting?.success || results.updateRouting?.success || false,
      message: results.createRouting?.success
        ? '可以建立 Manufacturing Routing'
        : results.updateRouting?.success
        ? '可以更新 Manufacturing Routing'
        : '無法建立或更新 Manufacturing Routing',
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
    message: '請使用 POST 方法測試建立 Manufacturing Routing',
    endpoint: '/api/test-create-routing',
    method: 'POST',
  });
}

