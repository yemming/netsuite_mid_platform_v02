import { getNetSuiteAPIClient } from '@/lib/netsuite-client';
import { createClient } from '@/utils/supabase/server';

/**
 * 通用同步配置類型
 */
export interface SyncConfig {
  tableName: string;
  suiteqlQuery: string;
  transformFunction: (item: any, syncTimestamp: string) => any;
  conflictColumn: string;
}

/**
 * 執行同步的通用函數
 */
export async function executeSync(config: SyncConfig) {
  const startTime = Date.now();
  const netsuite = getNetSuiteAPIClient();
  const supabase = await createClient();

  try {
    // 1. 從 NetSuite 查詢資料
    console.log(`開始從 NetSuite 查詢 ${config.tableName} 資料...`);
    const result = await netsuite.executeSuiteQL(config.suiteqlQuery, { fetchAll: true });
    const netsuiteData = result.items || [];
    console.log(`從 NetSuite 取得 ${netsuiteData.length} 筆 ${config.tableName} 資料`);

    if (netsuiteData.length === 0) {
      return {
        success: false,
        error: '無資料',
        message: `NetSuite 中沒有找到任何 ${config.tableName} 資料`,
        data: { totalRecords: 0, upsertedRecords: 0, timeTaken: `${Date.now() - startTime}ms` },
      };
    }

    // 2. 轉換資料格式
    const syncTimestamp = new Date().toISOString();
    const recordsToUpsert = netsuiteData.map((item: any) => config.transformFunction(item, syncTimestamp));

    console.log(`準備 Upsert ${recordsToUpsert.length} 筆記錄到 Supabase...`);

    // 3. 執行 Upsert
    const { data: upsertedData, error: upsertError } = await supabase
      .from(config.tableName)
      .upsert(recordsToUpsert, {
        onConflict: config.conflictColumn,
        ignoreDuplicates: false,
      })
      .select();

    if (upsertError) {
      console.error(`${config.tableName} Upsert 錯誤:`, upsertError);
      return {
        success: false,
        error: 'Supabase 寫入失敗',
        message: upsertError.message || `無法寫入資料到 Supabase`,
        details: upsertError,
      };
    }

    const timeTaken = Date.now() - startTime;

    return {
      success: true,
      message: `成功同步 ${recordsToUpsert.length} 筆 ${config.tableName} 資料`,
      data: {
        totalRecords: recordsToUpsert.length,
        upsertedRecords: upsertedData?.length || 0,
        timeTaken: `${timeTaken}ms`,
        syncTimestamp,
      },
    };
  } catch (error: any) {
    console.error(`同步 ${config.tableName} 資料錯誤:`, error);
    return {
      success: false,
      error: '同步失敗',
      message: error.message || '未知錯誤',
    };
  }
}

/**
 * 查詢表同步狀態
 */
export async function getTableSyncStatus(tableName: string) {
  try {
    const supabase = await createClient();

    // 查詢最新的同步記錄
    const { data, error } = await supabase
      .from(tableName)
      .select('sync_timestamp, updated_at')
      .order('sync_timestamp', { ascending: false })
      .limit(1);

    if (error) {
      return {
        success: false,
        error: error.message,
        totalRecords: 0,
        lastSyncTime: null,
        lastUpdateTime: null,
      };
    }

    // 統計總記錄數
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    return {
      success: true,
      totalRecords: count || 0,
      lastSyncTime: data && data.length > 0 ? data[0].sync_timestamp : null,
      lastUpdateTime: data && data.length > 0 ? data[0].updated_at : null,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '查詢失敗',
      totalRecords: 0,
      lastSyncTime: null,
      lastUpdateTime: null,
    };
  }
}

