import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 BOM 結構
 * 1. 先查詢現有的 BOM
 * 2. 如果有，取得詳細資訊並顯示所有欄位
 * 3. 如果沒有，提供建立指引
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 1. 先查詢現有的 BOM
    console.log('查詢現有的 BOM...');
    try {
      const bomList = await netsuite.getRecordList('bom', {
        fetchAll: false,
        limit: 5,
      });

      results.bomList = {
        success: true,
        count: bomList.items?.length || 0,
        items: bomList.items || [],
      };

      // 2. 如果有 BOM，取得詳細資訊
      if (bomList.items && bomList.items.length > 0) {
        console.log(`找到 ${bomList.items.length} 個 BOM，取得第一個的詳細資訊...`);
        
        const firstBomId = bomList.items[0].id;
        try {
          const bomDetail = await netsuite.getRecord('bom', firstBomId);
          
          results.bomDetail = {
            success: true,
            bomId: firstBomId,
            fields: Object.keys(bomDetail),
            fullStructure: bomDetail,
            // 提取關鍵欄位
            keyFields: {
              id: bomDetail.id,
              name: bomDetail.name || bomDetail.itemname || bomDetail.itemName,
              assemblyItem: bomDetail.assemblyitem || bomDetail.assemblyItem || bomDetail.item,
              revision: bomDetail.revision || bomDetail.revisionName,
              effectiveDate: bomDetail.effectivedate || bomDetail.effectiveDate,
              obsoleteDate: bomDetail.obsoletedate || bomDetail.obsoleteDate,
              isActive: bomDetail.isactive || bomDetail.isActive,
              memo: bomDetail.memo,
              components: bomDetail.component || bomDetail.components || bomDetail.item || [],
            },
          };

          // 3. 如果有 components，分析其結構
          const components = bomDetail.component || bomDetail.components || bomDetail.item || [];
          if (Array.isArray(components) && components.length > 0) {
            results.components = {
              count: components.length,
              sample: components[0],
              structure: Object.keys(components[0]),
            };
          }

        } catch (detailError: any) {
          results.bomDetail = {
            success: false,
            error: detailError.message,
            message: '無法取得 BOM 詳細資訊',
          };
        }
      } else {
        results.message = '系統中目前沒有 BOM 資料，需要先建立一個測試 BOM';
        results.instructions = {
          step1: {
            title: '建立 Assembly Item（組裝件）',
            description: '在 NetSuite UI 中建立一個測試用的 Assembly Item',
            path: 'Lists > Items > New > Assembly Item',
            requiredFields: [
              'Item Name（物料名稱）',
              'Item ID（物料編號）',
              'Base Unit（基本單位）',
            ],
          },
          step2: {
            title: '建立 BOM（物料清單）',
            description: '為該 Assembly Item 建立一個 BOM',
            path: 'Lists > Bills of Materials > New',
            requiredFields: [
              'Assembly Item（選擇剛建立的 Assembly Item）',
              'Name（BOM 名稱）',
              'Components（至少添加一個組件物料）',
            ],
          },
          step3: {
            title: '再次執行此 API',
            description: '建立完成後，再次執行此 API 來查看 BOM 的欄位結構',
          },
        };
      }

    } catch (error: any) {
      results.bomList = {
        success: false,
        error: error.message,
        message: '無法查詢 BOM 列表',
      };
    }

    // 4. 同時查詢 Assembly Items（了解相關結構）
    try {
      const assemblyItems = await netsuite.getRecordList('assemblyitem', {
        fetchAll: false,
        limit: 3,
      });

      if (assemblyItems.items && assemblyItems.items.length > 0) {
        const firstAssemblyItem = await netsuite.getRecord('assemblyitem', assemblyItems.items[0].id);
        results.assemblyItem = {
          success: true,
          count: assemblyItems.items.length,
          sample: {
            id: assemblyItems.items[0].id,
            fields: Object.keys(firstAssemblyItem),
            structure: firstAssemblyItem,
          },
        };
      }
    } catch (error: any) {
      // 忽略 Assembly Items 查詢失敗
      results.assemblyItem = {
        success: false,
        error: error.message,
      };
    }

    return NextResponse.json({
      success: results.bomList?.success || false,
      message: results.bomDetail 
        ? '成功取得 BOM 結構'
        : results.message || '請先建立一個測試 BOM',
      results,
    });
  } catch (error: any) {
    console.error('測試 BOM 結構錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試 BOM 結構時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '請使用 POST 方法測試 BOM 結構',
    endpoint: '/api/test-bom-structure',
    method: 'POST',
  });
}

