import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 嘗試透過 BOM 來查詢關聯的 Routing
 * 或嘗試其他可能的查詢方式
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 1. 先取得所有 BOM
    try {
      const bomList = await netsuite.getRecordList('bom', {
        fetchAll: true,
        limit: 100,
      });

      results.bomList = {
        success: true,
        count: bomList.items?.length || 0,
        items: bomList.items || [],
      };

      // 2. 對每個 BOM，取得詳細資訊並檢查是否有 routing 欄位
      if (bomList.items && bomList.items.length > 0) {
        const bomDetails: any[] = [];
        
        for (const bom of bomList.items) {
          try {
            const bomDetail = await netsuite.getRecord('bom', bom.id);
            
            // 檢查所有欄位，尋找可能的 routing 關聯
            const allFields = Object.keys(bomDetail);
            const routingRelatedFields = allFields.filter(field => 
              field.toLowerCase().includes('routing') ||
              field.toLowerCase().includes('manufacturing')
            );
            
            bomDetails.push({
              bomId: bom.id,
              bomName: bomDetail.name,
              allFields: allFields,
              routingRelatedFields: routingRelatedFields,
              fullDetail: bomDetail,
            });

            // 如果 BOM 有 assembly 欄位，檢查 assembly 是否有 routing
            if (bomDetail.assembly) {
              try {
                // assembly 可能是物件或 ID
                const assemblyId = typeof bomDetail.assembly === 'object' 
                  ? bomDetail.assembly.id 
                  : bomDetail.assembly;
                
                if (assemblyId) {
                  const assemblyDetail = await netsuite.getRecord('assemblyitem', assemblyId.toString());
                  bomDetails[bomDetails.length - 1].assembly = {
                    id: assemblyId,
                    fields: Object.keys(assemblyDetail),
                    routingFields: Object.keys(assemblyDetail).filter(f => 
                      f.toLowerCase().includes('routing')
                    ),
                    detail: assemblyDetail,
                  };
                }
              } catch (assemblyError: any) {
                bomDetails[bomDetails.length - 1].assemblyError = assemblyError.message;
              }
            }
          } catch (bomError: any) {
            bomDetails.push({
              bomId: bom.id,
              error: bomError.message,
            });
          }
        }
        
        results.bomDetails = bomDetails;
      }
    } catch (error: any) {
      results.bomList = {
        success: false,
        error: error.message,
      };
    }

    // 3. 嘗試使用已知的 Routing ID（如果有的話）
    // 由於我們不知道 Routing ID，先嘗試查詢 metadata 看看是否有其他線索

    // 4. 檢查 SuiteQL 是否有其他表名
    const suiteqlQueries = [
      "SELECT * FROM manufacturingrouting WHERE name LIKE '%AAA%' FETCH FIRST 5 ROWS ONLY",
      "SELECT id, name FROM manufacturingrouting FETCH FIRST 5 ROWS ONLY",
      "SELECT * FROM routing FETCH FIRST 5 ROWS ONLY",
    ];

    for (const query of suiteqlQueries) {
      try {
        const result = await netsuite.executeSuiteQL(query, {
          fetchAll: false,
        });
        results[`suiteql_${suiteqlQueries.indexOf(query)}`] = {
          success: true,
          query: query,
          count: result.items?.length || 0,
          items: result.items || [],
        };
      } catch (error: any) {
        results[`suiteql_${suiteqlQueries.indexOf(query)}`] = {
          success: false,
          query: query,
          error: error.message,
        };
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
    message: '請使用 POST 方法測試透過 BOM 查詢 Routing',
    endpoint: '/api/test-routing-via-bom',
    method: 'POST',
  });
}

