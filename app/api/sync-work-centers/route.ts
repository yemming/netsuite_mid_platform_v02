import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';
import { createClient } from '@/utils/supabase/server';

/**
 * 同步 Work Centers（工作中心）
 * ⚠️ 注意：NetSuite SuiteQL 不支援 workcenter 表，使用 REST API
 */
export async function POST() {
  try {
    const startTime = Date.now();
    const netsuite = getNetSuiteAPIClient();
    const supabase = await createClient();

    console.log('開始從 NetSuite REST API 查詢 Work Center 資料...');

    // 使用 REST API 查詢
    const result = await netsuite.getRecordList('workcenter', {
      fetchAll: true,
      limit: 1000,
    });

    const netsuiteData = result.items || [];
    console.log(`從 NetSuite 取得 ${netsuiteData.length} 筆 Work Center 資料`);

    if (netsuiteData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '無資料',
          message: 'NetSuite 中沒有找到任何 Work Center 資料',
        },
        { status: 404 }
      );
    }

    // 轉換資料格式
    const syncTimestamp = new Date().toISOString();
    const recordsToUpsert = netsuiteData.map((item: any) => {
      // REST API 返回的資料結構
      const name = item.name || '';
      const locationId = item.location ? parseInt(item.location.id || item.location) : null;
      const capacityPerHour = item.capacityPerHour 
        ? parseFloat(item.capacityPerHour) 
        : (item.capacityperhour ? parseFloat(item.capacityperhour) : null);
      const costPerHour = item.costPerHour 
        ? parseFloat(item.costPerHour) 
        : (item.costperhour ? parseFloat(item.costperhour) : null);
      const isActive = item.isInactive !== true && item.isinactive !== 'T';

      return {
        netsuite_internal_id: parseInt(item.id),
        name: name,
        location_id: locationId,
        capacity_per_hour: capacityPerHour,
        cost_per_hour: costPerHour,
        is_active: isActive,
        sync_timestamp: syncTimestamp,
        updated_at: syncTimestamp,
      };
    });

    console.log(`準備 Upsert ${recordsToUpsert.length} 筆記錄到 Supabase...`);

    // 執行 Upsert
    const { data: upsertedData, error: upsertError } = await supabase
      .from('ns_work_centers')
      .upsert(recordsToUpsert, {
        onConflict: 'netsuite_internal_id',
        ignoreDuplicates: false,
      })
      .select();

    if (upsertError) {
      console.error('Work Centers Upsert 錯誤:', upsertError);
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
      message: `成功同步 ${upsertedData?.length || 0} 筆 Work Center 資料`,
      data: {
        totalRecords: netsuiteData.length,
        upsertedRecords: upsertedData?.length || 0,
        timeTaken: `${timeTaken}ms`,
      },
    });
  } catch (error: any) {
    console.error('同步 Work Centers 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '同步失敗',
        message: error.message || '同步 Work Centers 時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { getTableSyncStatus } = await import('@/lib/sync-utils');
  const status = await getTableSyncStatus('ns_work_centers');
  return NextResponse.json(status);
}

