import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 BOM 查詢
 * 嘗試多種方法來取得 BOM 資料
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      methods: {},
    };

    // 方法 1: 嘗試直接 List API
    console.log('測試方法 1: BOM 直接 List API...');
    try {
      const listResult = await netsuite.getRecordList('bom', {
        fetchAll: false,
        limit: 5,
      });
      results.methods.list = {
        success: true,
        count: listResult.items?.length || 0,
        sample: listResult.items?.[0] || null,
        message: '✅ List API 成功',
      };
    } catch (error: any) {
      results.methods.list = {
        success: false,
        error: error.message,
        status: error.status,
        message: '❌ List API 失敗',
      };
    }

    // 方法 2: 檢查 metadata catalog
    console.log('測試方法 2: 檢查 BOM 在 metadata catalog...');
    try {
      const catalog = await netsuite.getMetadataCatalog();
      const bomType = catalog.items?.find(
        (item: any) => item.name?.toLowerCase() === 'bom'
      );

      if (bomType) {
        results.metadata = {
          found: true,
          name: bomType.name,
          links: bomType.links,
        };
      } else {
        results.metadata = {
          found: false,
          message: '⚠️ 在 metadata catalog 中找不到 bom',
        };
      }
    } catch (error: any) {
      results.metadata = {
        error: error.message,
        message: '❌ 取得 metadata 失敗',
      };
    }

    // 方法 3: 嘗試其他可能的 record type 名稱
    console.log('測試方法 3: 嘗試其他可能的 record type 名稱...');
    const alternativeNames = ['bomrevision', 'billofmaterials', 'assemblybom'];
    
    for (const altName of alternativeNames) {
      try {
        const altResult = await netsuite.getRecordList(altName, {
          fetchAll: false,
          limit: 3,
        });
        results.methods[`list_${altName}`] = {
          success: true,
          count: altResult.items?.length || 0,
          sample: altResult.items?.[0] || null,
          message: `✅ ${altName} List API 成功`,
        };
      } catch (error: any) {
        results.methods[`list_${altName}`] = {
          success: false,
          error: error.message,
          message: `❌ ${altName} List API 失敗`,
        };
      }
    }

    // 方法 4: 檢查是否有已知的 BOM ID（如果有）
    // 這需要先知道一個 BOM 的 ID，暫時跳過

    // 方法 5: 檢查權限
    console.log('檢查權限相關資訊...');
    try {
      const testResult = await netsuite.getRecordList('assemblyitem', {
        fetchAll: false,
        limit: 1,
      });
      results.permission_check = {
        api_connection: '✅ API 連線正常',
        can_access_assembly_items: testResult.items?.length > 0,
        message: '可以存取 assemblyitem，可能 BOM 需要透過 Assembly Item 關聯',
      };
    } catch (error: any) {
      results.permission_check = {
        api_connection: '❌ API 連線有問題',
        error: error.message,
      };
    }

    // 總結
    const successfulMethods = Object.values(results.methods).filter(
      (m: any) => m.success
    );
    
    results.summary = {
      total_methods: Object.keys(results.methods).length,
      successful_methods: successfulMethods.length,
      recommended_method: successfulMethods.length > 0 
        ? Object.keys(results.methods).find(
            (key) => results.methods[key].success
          )
        : 'none',
      recommendation: successfulMethods.length > 0
        ? `✅ 建議使用找到的方法`
        : '❌ 所有方法都失敗，可能原因：1) NetSuite 權限設定 2) Record type 名稱不正確 3) BOM 功能未啟用 4) 需要透過 Assembly Item 關聯',
    };

    return NextResponse.json({
      success: successfulMethods.length > 0,
      message: successfulMethods.length > 0 
        ? '至少有一種方法成功'
        : '所有方法都失敗，請檢查權限或 BOM 功能是否啟用',
      results,
    });
  } catch (error: any) {
    console.error('測試 BOM 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試 BOM 時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '請使用 POST 方法測試 BOM 查詢',
    endpoint: '/api/test-bom',
    method: 'POST',
    description: '此端點會測試多種查詢 BOM 的方法，幫助診斷權限或 API 問題',
  });
}

