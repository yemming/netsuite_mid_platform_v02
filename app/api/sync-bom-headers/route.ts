import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';
import { createClient } from '@/utils/supabase/server';

/**
 * 同步 BOM Headers（配方表頭）
 * ⚠️ 注意：NetSuite SuiteQL 不支援 bom 表，使用 REST API
 */
export async function POST() {
  try {
    const startTime = Date.now();
    const netsuite = getNetSuiteAPIClient();
    const supabase = await createClient();

    console.log('開始從 NetSuite REST API 查詢 BOM Header 資料...');

    // 方法 1: 嘗試使用 List API
    let result;
    try {
      result = await netsuite.getRecordList('bom', {
        fetchAll: true,
        limit: 1000,
      });
    } catch (listError: any) {
      console.warn('List API 失敗，可能原因：1) 權限問題 2) 系統中沒有 BOM', listError.message);
      
      // 如果 List API 失敗，嘗試透過 Assembly Items 查詢
      try {
        console.log('嘗試透過 Assembly Items 查詢 BOM...');
        const assemblyItems = await netsuite.getRecordList('assemblyitem', {
          fetchAll: true,
          limit: 1000,
        });

        if (assemblyItems.items && assemblyItems.items.length > 0) {
          // 對每個 Assembly Item，嘗試取得其 BOM
          const bomItems: any[] = [];
          
          for (const assemblyItem of assemblyItems.items.slice(0, 50)) { // 限制處理前 50 個，避免 timeout
            try {
              const itemDetail = await netsuite.getRecord('assemblyitem', assemblyItem.id);
              const bomId = itemDetail.billOfMaterials?.id || itemDetail.bom?.id || itemDetail.billofmaterials?.id;
              
              if (bomId) {
                try {
                  const bomDetail = await netsuite.getRecord('bom', bomId);
                  bomItems.push({
                    id: bomId,
                    ...bomDetail,
                  });
                } catch (bomError: any) {
                  console.warn(`無法取得 BOM ${bomId} 的詳細資訊:`, bomError.message);
                }
              }
            } catch (itemError: any) {
              console.warn(`無法取得 Assembly Item ${assemblyItem.id} 的詳細資訊:`, itemError.message);
            }
          }

          result = {
            items: bomItems,
            count: bomItems.length,
            hasMore: false,
          };
        } else {
          throw new Error('系統中沒有 Assembly Items，無法查詢 BOM');
        }
      } catch (assemblyError: any) {
        // 如果兩種方法都失敗，拋出錯誤
        throw new Error(
          `無法取得 BOM 資料。List API 錯誤: ${listError.message}。Assembly Items 方法錯誤: ${assemblyError.message}。請檢查：1) NetSuite 權限設定（Lists > Bill of Materials, Lists > Assembly Items, REST Web 服務） 2) 系統中是否有 Assembly Items 和 BOM`
        );
      }
    }

    const netsuiteData = result.items || [];
    console.log(`從 NetSuite 取得 ${netsuiteData.length} 筆 BOM Header 資料`);

    if (netsuiteData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '無資料',
          message: 'NetSuite 中沒有找到任何 BOM Header 資料',
        },
        { status: 404 }
      );
    }

    // 轉換資料格式
    const syncTimestamp = new Date().toISOString();
    const recordsToUpsert = netsuiteData.map((item: any) => {
      // REST API 返回的資料結構
      const name = item.name || '';
      const assemblyItemId = item.assemblyItem 
        ? parseInt(item.assemblyItem.id || item.assemblyItem) 
        : (item.assemblyitem ? parseInt(item.assemblyitem) : null);
      const revision = item.revision || item.revisionnumber || null;
      const isActive = item.isInactive !== true && item.isinactive !== 'T';
      const effectiveDate = item.effectiveDate || item.effectivedate || null;
      const obsoleteDate = item.obsoleteDate || item.obsoletedate || null;
      const memo = item.memo || null;

      return {
        netsuite_internal_id: parseInt(item.id),
        assembly_item_id: assemblyItemId,
        name: name,
        revision: revision,
        is_active: isActive,
        effective_date: effectiveDate,
        obsolete_date: obsoleteDate,
        memo: memo,
        sync_timestamp: syncTimestamp,
        updated_at: syncTimestamp,
      };
    });

    console.log(`準備 Upsert ${recordsToUpsert.length} 筆記錄到 Supabase...`);

    // 執行 Upsert
    const { data: upsertedData, error: upsertError } = await supabase
      .from('ns_bom_headers')
      .upsert(recordsToUpsert, {
        onConflict: 'netsuite_internal_id',
        ignoreDuplicates: false,
      })
      .select();

    if (upsertError) {
      console.error('BOM Headers Upsert 錯誤:', upsertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase 寫入失敗',
          message: upsertError.message || '無法寫入資料到 Supabase',
          details: upsertError,
        },
        { status: 500 }
      );
    }

    const timeTaken = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `成功同步 ${upsertedData?.length || 0} 筆 BOM Header 資料`,
      data: {
        totalRecords: netsuiteData.length,
        upsertedRecords: upsertedData?.length || 0,
        timeTaken: `${timeTaken}ms`,
      },
    });
  } catch (error: any) {
    console.error('同步 BOM Headers 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '同步失敗',
        message: error.message || '同步 BOM Headers 時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { getTableSyncStatus } = await import('@/lib/sync-utils');
  const status = await getTableSyncStatus('ns_bom_headers');
  return NextResponse.json(status);
}

