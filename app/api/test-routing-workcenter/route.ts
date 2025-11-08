import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Routing 和 Work Center 的查詢方式
 * 根據截圖發現：
 * 1. Routing ID 是 1
 * 2. Work Center 可能是透過 Employee Group 實現
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      routingId: '1', // 從截圖中看到的 Routing ID
    };

    // 1. 嘗試查詢 Routing ID 1（從截圖中看到）
    console.log('查詢 Manufacturing Routing ID 1...');
    try {
      const routingDetail = await netsuite.getRecord('manufacturingrouting', '1');
      results.routing = {
        success: true,
        fields: Object.keys(routingDetail),
        fullStructure: routingDetail,
        keyFields: {
          id: routingDetail.id,
          name: routingDetail.name,
          billOfMaterials: routingDetail.billOfMaterials || routingDetail.billofmaterials,
          workCenter: routingDetail.workCenter || routingDetail.workcenter,
          routingSteps: routingDetail.routingSteps || routingDetail.routingsteps,
        },
      };
    } catch (error: any) {
      results.routing = {
        success: false,
        error: error.message,
        note: '可能需要權限，或 record type 名稱不同',
      };
    }

    // 2. 嘗試查詢 Employee Group（Work Center 可能是透過這個實現）
    console.log('查詢 Employee Group...');
    try {
      const employeeGroups = await netsuite.getRecordList('employeegroup', {
        fetchAll: false,
        limit: 10,
      });
      
      results.employeeGroups = {
        success: true,
        count: employeeGroups.items?.length || 0,
        items: employeeGroups.items || [],
      };

      // 如果有 Employee Groups，嘗試取得詳細資訊
      if (employeeGroups.items && employeeGroups.items.length > 0) {
        try {
          const firstGroup = await netsuite.getRecord('employeegroup', employeeGroups.items[0].id);
          results.employeeGroupDetail = {
            id: employeeGroups.items[0].id,
            fields: Object.keys(firstGroup),
            fullStructure: firstGroup,
            // 檢查是否有 manufacturing work center 相關欄位
            manufacturingWorkCenter: firstGroup.manufacturingWorkCenter || 
                                     firstGroup.manufacturingworkcenter ||
                                     firstGroup.isManufacturingWorkCenter ||
                                     firstGroup.ismanufacturingworkcenter,
          };
        } catch (detailError: any) {
          results.employeeGroupDetail = {
            error: detailError.message,
          };
        }
      }
    } catch (error: any) {
      results.employeeGroups = {
        success: false,
        error: error.message,
      };
    }

    // 3. 嘗試查詢特定的 Employee Group（Packing Machine Group，ID 可能是 2266）
    console.log('查詢 Packing Machine Group (ID 2266)...');
    try {
      const packingGroup = await netsuite.getRecord('employeegroup', '2266');
      results.packingGroup = {
        success: true,
        fields: Object.keys(packingGroup),
        fullStructure: packingGroup,
        manufacturingWorkCenterFields: Object.keys(packingGroup).filter(k => 
          k.toLowerCase().includes('manufacturing') || 
          k.toLowerCase().includes('workcenter') ||
          k.toLowerCase().includes('work_center')
        ),
      };
    } catch (error: any) {
      results.packingGroup = {
        success: false,
        error: error.message,
        note: '可能 ID 不對，或需要權限',
      };
    }

    // 4. 嘗試其他可能的 Work Center record types
    const workCenterTypes = [
      'manufacturingworkcenter',
      'workcenter',
      'manufacturingworkcentergroup',
      'workcentergroup',
    ];

    for (const wcType of workCenterTypes) {
      try {
        const wcList = await netsuite.getRecordList(wcType, {
          fetchAll: false,
          limit: 5,
        });
        results[`workCenter_${wcType}`] = {
          success: true,
          count: wcList.items?.length || 0,
          items: wcList.items || [],
        };
      } catch (error: any) {
        results[`workCenter_${wcType}`] = {
          success: false,
          error: error.message,
        };
      }
    }

    // 5. 檢查 metadata catalog 中是否有相關的 record types
    try {
      const catalog = await netsuite.getMetadataCatalog();
      const workCenterRelated = catalog.items?.filter((item: any) =>
        item.name?.toLowerCase().includes('workcenter') ||
        item.name?.toLowerCase().includes('work_center') ||
        item.name?.toLowerCase().includes('manufacturingworkcenter') ||
        item.name?.toLowerCase().includes('employeegroup')
      ) || [];
      
      results.metadataCatalog = {
        workCenterRelated: workCenterRelated.map((item: any) => ({
          name: item.name,
          links: item.links,
        })),
      };
    } catch (error: any) {
      results.metadataCatalog = {
        error: error.message,
      };
    }

    // 6. 如果 Routing 查詢成功，檢查其中的 Work Center 欄位
    if (results.routing?.success) {
      const routingData = results.routing.fullStructure;
      
      // 檢查 routingSteps 或相關欄位
      if (routingData.routingSteps || routingData.routingsteps) {
        results.routingSteps = routingData.routingSteps || routingData.routingsteps;
      }

      // 檢查是否有 workCenter 相關的 links
      if (routingData.links) {
        const workCenterLinks = routingData.links.filter((link: any) =>
          link.rel?.toLowerCase().includes('workcenter') ||
          link.href?.toLowerCase().includes('workcenter')
        );
        if (workCenterLinks.length > 0) {
          results.routingWorkCenterLinks = workCenterLinks;
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
    message: '請使用 POST 方法測試 Routing 和 Work Center',
    endpoint: '/api/test-routing-workcenter',
    method: 'POST',
  });
}

