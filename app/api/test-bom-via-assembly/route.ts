import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試透過 Assembly Item 查詢 BOM
 * BOM 可能需要透過 Assembly Item 關聯查詢
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 方法 1: 查詢 Assembly Items（有 BOM 的產品）
    console.log('查詢 Assembly Items...');
    try {
      const assemblyItems = await netsuite.getRecordList('assemblyitem', {
        fetchAll: false,
        limit: 10,
      });
      
      results.assemblyItems = {
        success: true,
        count: assemblyItems.items?.length || 0,
        items: assemblyItems.items?.map((item: any) => ({
          id: item.id,
          links: item.links,
        })) || [],
      };

      // 如果有 Assembly Items，嘗試取得一個的詳細資訊，看看是否有 BOM 相關欄位
      if (assemblyItems.items && assemblyItems.items.length > 0) {
        try {
          const firstItemId = assemblyItems.items[0].id;
          const itemDetail = await netsuite.getRecord('assemblyitem', firstItemId);
          
          results.assemblyItemDetail = {
            success: true,
            itemId: firstItemId,
            fields: Object.keys(itemDetail),
            bom_related_fields: Object.keys(itemDetail).filter((key: string) => 
              key.toLowerCase().includes('bom') || 
              key.toLowerCase().includes('bill')
            ),
            sample: itemDetail,
          };

          // 檢查是否有 BOM ID 可以直接查詢
          if (itemDetail.billOfMaterials || itemDetail.bom || itemDetail.billofmaterials) {
            const bomId = itemDetail.billOfMaterials?.id || itemDetail.bom?.id || itemDetail.billofmaterials?.id;
            if (bomId) {
              results.bomId_found = bomId;
              try {
                const bomDetail = await netsuite.getRecord('bom', bomId);
                results.bomDetail = {
                  success: true,
                  bomId,
                  fields: Object.keys(bomDetail),
                  sample: bomDetail,
                };
              } catch (bomError: any) {
                results.bomDetail = {
                  success: false,
                  bomId,
                  error: bomError.message,
                };
              }
            }
          }
        } catch (detailError: any) {
          results.assemblyItemDetail = {
            success: false,
            error: detailError.message,
          };
        }
      }
    } catch (error: any) {
      results.assemblyItems = {
        success: false,
        error: error.message,
      };
    }

    // 方法 2: 嘗試使用 SuiteQL 查詢 BOM（如果支援）
    console.log('嘗試使用 SuiteQL 查詢 BOM...');
    try {
      const suiteqlQuery = `
        SELECT 
          id,
          name,
          assemblyitem,
          revision
        FROM bom
        ORDER BY id
        LIMIT 5
      `;
      
      const suiteqlResult = await netsuite.executeSuiteQL(suiteqlQuery, {
        fetchAll: false,
        maxRecords: 5,
      });

      results.suiteql = {
        success: true,
        count: suiteqlResult.items?.length || 0,
        items: suiteqlResult.items || [],
      };
    } catch (error: any) {
      results.suiteql = {
        success: false,
        error: error.message,
        message: 'SuiteQL 不支援 BOM 表查詢',
      };
    }

    return NextResponse.json({
      success: results.assemblyItems?.success || results.suiteql?.success || false,
      message: 'BOM 查詢測試完成',
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
    message: '請使用 POST 方法測試透過 Assembly Item 查詢 BOM',
    endpoint: '/api/test-bom-via-assembly',
    method: 'POST',
  });
}

