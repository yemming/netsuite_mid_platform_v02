import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';
import { createClient } from '@/utils/supabase/server';

/**
 * 同步 BOM Lines（配方明細）
 * ⚠️ 注意：需要從每個 BOM Header 的詳細資訊中獲取 components
 */
export async function POST() {
  try {
    const startTime = Date.now();
    const netsuite = getNetSuiteAPIClient();
    const supabase = await createClient();

    console.log('開始從 NetSuite REST API 查詢 BOM Lines 資料...');

    // 1. 先獲取所有 BOM Headers
    const bomHeadersResult = await netsuite.getRecordList('bom', {
      fetchAll: true,
      limit: 1000,
    });

    const bomHeaders = bomHeadersResult.items || [];
    console.log(`找到 ${bomHeaders.length} 個 BOM Headers，開始獲取詳細資訊...`);

    if (bomHeaders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '無資料',
          message: 'NetSuite 中沒有找到任何 BOM Header 資料',
        },
        { status: 404 }
      );
    }

    // 2. 對每個 BOM Header，獲取詳細資訊（包含 components）
    const allBomLines: any[] = [];

    for (const bomHeader of bomHeaders) {
      try {
        const bomId = bomHeader.id;
        const bomDetail = await netsuite.getRecord('bom', bomId);

        // 從詳細資訊中提取 components
        // NetSuite REST API 可能使用不同的欄位名稱
        const components = bomDetail.item || bomDetail.items || bomDetail.component || bomDetail.components || [];

        if (Array.isArray(components) && components.length > 0) {
          components.forEach((component: any, index: number) => {
            const componentItemId = component.item 
              ? parseInt(component.item.id || component.item) 
              : (component.itemid ? parseInt(component.itemid) : null);
            const quantity = component.quantity 
              ? parseFloat(component.quantity) 
              : (component.quantityrequired ? parseFloat(component.quantityrequired) : 1);
            const unitOfMeasure = component.unitOfMeasure || component.unitofmeasure || null;
            const componentYield = component.componentYield 
              ? parseFloat(component.componentYield) 
              : (component.componentyield ? parseFloat(component.componentyield) : 100.00);
            const isPhantom = component.isPhantom === true || component.isphantom === 'T';
            const supplyType = component.supplyType || component.supplytype || null;

            allBomLines.push({
              netsuite_bom_id: parseInt(bomId),
              line_number: index + 1,
              component_item_id: componentItemId,
              quantity: quantity,
              unit_of_measure: unitOfMeasure,
              component_yield: componentYield,
              is_phantom: isPhantom,
              supply_type: supplyType,
            });
          });
        }
      } catch (bomError: any) {
        console.warn(`無法獲取 BOM ${bomHeader.id} 的詳細資訊:`, bomError.message);
        // 繼續處理下一個 BOM
      }
    }

    console.log(`從 ${bomHeaders.length} 個 BOM Headers 中取得 ${allBomLines.length} 筆 BOM Lines`);

    if (allBomLines.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '無資料',
          message: '沒有找到任何 BOM Lines 資料',
        },
        { status: 404 }
      );
    }

    // 3. 獲取現有的 BOM Headers 以便關聯
    const { data: existingBomHeaders } = await supabase
      .from('ns_bom_headers')
      .select('id, netsuite_internal_id');

    const bomHeaderMap = new Map<number, string>();
    if (existingBomHeaders) {
      existingBomHeaders.forEach((header: any) => {
        bomHeaderMap.set(header.netsuite_internal_id, header.id);
      });
    }

    // 4. 轉換資料格式並加入 bom_header_id
    const syncTimestamp = new Date().toISOString();
    const recordsToUpsert = allBomLines.map((line: any) => {
      const bomHeaderId = bomHeaderMap.get(line.netsuite_bom_id) || null;

      return {
        bom_header_id: bomHeaderId,
        netsuite_bom_id: line.netsuite_bom_id,
        line_number: line.line_number,
        component_item_id: line.component_item_id,
        quantity: line.quantity,
        unit_of_measure: line.unit_of_measure,
        component_yield: line.component_yield || 100.00,
        is_phantom: line.is_phantom || false,
        supply_type: line.supply_type,
        updated_at: syncTimestamp,
      };
    });

    console.log(`準備 Upsert ${recordsToUpsert.length} 筆記錄到 Supabase...`);

    // 5. 先刪除現有的 BOM Lines（因為可能會變化）
    // 或者使用更精確的衝突處理
    const { error: deleteError } = await supabase
      .from('ns_bom_lines')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 刪除所有記錄

    if (deleteError) {
      console.warn('刪除現有 BOM Lines 時發生錯誤:', deleteError);
      // 繼續執行，因為可能是表為空
    }

    // 6. 執行 Insert（因為我們已經刪除了所有記錄）
    const { data: insertedData, error: insertError } = await supabase
      .from('ns_bom_lines')
      .insert(recordsToUpsert)
      .select();

    if (insertError) {
      console.error('BOM Lines Insert 錯誤:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase 寫入失敗',
          message: insertError.message || '無法寫入資料到 Supabase',
          details: insertError,
        },
        { status: 500 }
      );
    }

    const timeTaken = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `成功同步 ${insertedData?.length || 0} 筆 BOM Lines 資料`,
      data: {
        totalBomHeaders: bomHeaders.length,
        totalBomLines: allBomLines.length,
        insertedRecords: insertedData?.length || 0,
        timeTaken: `${timeTaken}ms`,
      },
    });
  } catch (error: any) {
    console.error('同步 BOM Lines 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '同步失敗',
        message: error.message || '同步 BOM Lines 時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { getTableSyncStatus } = await import('@/lib/sync-utils');
  const status = await getTableSyncStatus('ns_bom_lines');
  return NextResponse.json(status);
}

