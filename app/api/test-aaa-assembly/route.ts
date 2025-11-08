import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 AAA Assembly Item 的完整結構
 * 包括：Assembly Item、BOM、Routing、Work Center
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      assemblyItemId: '328', // AAA Assembly Item ID
    };

    // 1. 查詢 Assembly Item 詳細資訊
    console.log('查詢 Assembly Item 328 (AAA)...');
    try {
      const assemblyDetail = await netsuite.getRecord('assemblyitem', '328');
      results.assemblyItem = {
        success: true,
        fields: Object.keys(assemblyDetail),
        fullStructure: assemblyDetail,
        // 特別關注的欄位
        keyFields: {
          id: assemblyDetail.id,
          itemId: assemblyDetail.itemId || assemblyDetail.itemid,
          name: assemblyDetail.name || assemblyDetail.displayName,
          billOfMaterials: assemblyDetail.billOfMaterials || assemblyDetail.billofmaterials,
          routing: assemblyDetail.routing || assemblyDetail.manufacturingRouting,
        },
      };
    } catch (error: any) {
      results.assemblyItem = {
        success: false,
        error: error.message,
      };
    }

    // 2. 查詢 BOM（已知 ID 是 1）
    console.log('查詢 BOM 1 (AAA BOM)...');
    try {
      const bomDetail = await netsuite.getRecord('bom', '1');
      results.bom = {
        success: true,
        fields: Object.keys(bomDetail),
        fullStructure: bomDetail,
        keyFields: {
          id: bomDetail.id,
          name: bomDetail.name,
          assembly: bomDetail.assembly,
          routing: bomDetail.routing || bomDetail.manufacturingRouting,
        },
      };

      // 檢查 BOM 是否有 routing 相關的 sub-resources
      if (bomDetail.links) {
        const routingLinks = bomDetail.links.filter((link: any) =>
          link.rel?.toLowerCase().includes('routing') ||
          link.href?.toLowerCase().includes('routing')
        );
        if (routingLinks.length > 0) {
          results.bom.routingLinks = routingLinks;
        }
      }
    } catch (error: any) {
      results.bom = {
        success: false,
        error: error.message,
      };
    }

    // 3. 嘗試查詢 BOM 的 sub-resources（components）
    console.log('查詢 BOM Components...');
    try {
      // BOM components 可能透過子資源端點取得
      const bomComponents = await netsuite.request(
        '/services/rest/record/v1/bom/1/component',
        'GET'
      );
      results.bomComponents = {
        success: true,
        data: bomComponents,
      };
    } catch (error: any) {
      // 可能不是這個端點，嘗試其他方式
      try {
        const bomComponents = await netsuite.request(
          '/services/rest/record/v1/bom/1/components',
          'GET'
        );
        results.bomComponents = {
          success: true,
          data: bomComponents,
        };
      } catch (error2: any) {
        results.bomComponents = {
          success: false,
          error: error2.message,
          note: '嘗試了 /component 和 /components 端點都失敗',
        };
      }
    }

    // 4. 嘗試使用已知的 Routing ID（如果有的話）
    // 由於我們不知道 Routing ID，先檢查 Assembly Item 或 BOM 中是否有
    if (results.assemblyItem?.success && results.assemblyItem.keyFields?.billOfMaterials) {
      const bomId = results.assemblyItem.keyFields.billOfMaterials?.id || 
                    results.assemblyItem.keyFields.billOfMaterials;
      
      if (bomId) {
        console.log(`從 Assembly Item 中找到 BOM ID: ${bomId}`);
        // BOM ID 我們已經知道了，是 1
      }
    }

    // 5. 嘗試查詢 Routing（嘗試一些可能的 ID）
    console.log('嘗試查詢 Routing（使用可能的 ID）...');
    const possibleRoutingIds = ['1', '2', '3'];
    for (const routingId of possibleRoutingIds) {
      try {
        const routingDetail = await netsuite.getRecord('manufacturingrouting', routingId);
        results[`routing_${routingId}`] = {
          success: true,
          fields: Object.keys(routingDetail),
          fullStructure: routingDetail,
        };
        break; // 找到一個就停止
      } catch (error: any) {
        results[`routing_${routingId}`] = {
          success: false,
          error: error.message,
        };
      }
    }

    // 6. 嘗試查詢 Work Center（嘗試一些可能的 ID）
    console.log('嘗試查詢 Work Center（使用可能的 ID）...');
    const possibleWorkCenterIds = ['1', '2', '3'];
    for (const wcId of possibleWorkCenterIds) {
      // 先嘗試 manufacturingrouting 相關的 record types
      const wcTypes = ['workcenter', 'manufacturingworkcenter'];
      for (const wcType of wcTypes) {
        try {
          const wcDetail = await netsuite.getRecord(wcType, wcId);
          results[`workCenter_${wcType}_${wcId}`] = {
            success: true,
            fields: Object.keys(wcDetail),
            fullStructure: wcDetail,
          };
          break;
        } catch (error: any) {
          // 忽略錯誤
        }
      }
    }

    // 7. 檢查 Assembly Item 是否有 routing 相關的 sub-resources
    if (results.assemblyItem?.success && results.assemblyItem.fullStructure?.links) {
      const routingLinks = results.assemblyItem.fullStructure.links.filter((link: any) =>
        link.rel?.toLowerCase().includes('routing') ||
        link.href?.toLowerCase().includes('routing')
      );
      if (routingLinks.length > 0) {
        results.assemblyItem.routingLinks = routingLinks;
        
        // 嘗試從 link 中提取 ID 並查詢
        for (const link of routingLinks) {
          try {
            const href = link.href;
            const routingIdMatch = href.match(/manufacturingrouting\/(\d+)/);
            if (routingIdMatch) {
              const routingId = routingIdMatch[1];
              const routingDetail = await netsuite.getRecord('manufacturingrouting', routingId);
              results[`routing_from_link_${routingId}`] = {
                success: true,
                fields: Object.keys(routingDetail),
                fullStructure: routingDetail,
              };
            }
          } catch (error: any) {
            // 忽略錯誤
          }
        }
      }
    }

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
    message: '請使用 POST 方法測試 AAA Assembly Item 的完整結構',
    endpoint: '/api/test-aaa-assembly',
    method: 'POST',
  });
}

