import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';
import { createClient } from '@/utils/supabase/server';

/**
 * 同步 Accounting Periods（會計期間）
 * ⚠️ 注意：NetSuite SuiteQL 不支援 accountingperiod 表，使用 REST API
 */
export async function POST() {
  try {
    const startTime = Date.now();
    const netsuite = getNetSuiteAPIClient();
    const supabase = await createClient();

    console.log('開始從 NetSuite REST API 查詢 Accounting Period 資料...');

    // 方法 1: 嘗試使用 List API
    let result;
    try {
      result = await netsuite.getRecordList('accountingperiod', {
        fetchAll: true,
        limit: 1000,
      });
    } catch (listError: any) {
      console.warn('List API 失敗，嘗試使用 Search API:', listError.message);
      
      // 方法 2: 如果 List API 失敗，嘗試使用 Search API
      try {
        const searchBody = {
          basic: [], // 空查詢 = 查詢所有記錄
        };

        const searchResult = await netsuite.request(
          '/services/rest/record/v1/accountingperiod/search',
          'POST',
          searchBody
        );

        result = {
          items: searchResult.items || [],
          count: searchResult.items?.length || 0,
          hasMore: searchResult.hasMore || false,
        };
      } catch (searchError: any) {
        // 如果兩種方法都失敗，拋出錯誤
        throw new Error(
          `無法取得 Accounting Period 資料。List API 錯誤: ${listError.message}。Search API 錯誤: ${searchError.message}。請檢查：1) NetSuite 權限設定（Lists > Accounting Periods, REST Web 服務） 2) Record type 是否正確`
        );
      }
    }

    const listItems = result.items || [];
    console.log(`從 NetSuite List API 取得 ${listItems.length} 筆 Accounting Period ID`);

    if (listItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '無資料',
          message: 'NetSuite 中沒有找到任何 Accounting Period 資料',
        },
        { status: 404 }
      );
    }

    // ⚠️ 重要：List API 只返回 id 和 links，需要使用 getRecord 取得詳細資料
    console.log('開始使用 getRecord 取得每筆記錄的詳細資料...');
    const netsuiteData: any[] = [];
    
    // 批次處理，每批 10 個，避免 API 限制
    const batchSize = 10;
    for (let i = 0; i < listItems.length; i += batchSize) {
      const batch = listItems.slice(i, i + batchSize);
      console.log(`處理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(listItems.length / batchSize)} (records ${i + 1}-${Math.min(i + batchSize, listItems.length)})...`);
      
      // 並行查詢批次中的每個記錄
      const batchPromises = batch.map(async (item: any) => {
        const recordId = item.id;
        try {
          const detail = await netsuite.getRecord('accountingperiod', recordId);
          return detail;
        } catch (error: any) {
          console.warn(`取得 Accounting Period ${recordId} 詳細資料失敗:`, error.message);
          // 如果失敗，至少返回基本資訊
          return {
            id: recordId,
            periodName: null,
            startDate: null,
            endDate: null,
            _error: error.message,
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      netsuiteData.push(...batchResults);
      
      // 每批次之間稍作延遲，避免 API 限制
      if (i + batchSize < listItems.length) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 延遲 100ms
      }
    }
    
    console.log(`從 NetSuite 取得 ${netsuiteData.length} 筆 Accounting Period 詳細資料`);

    // 轉換資料格式
    const syncTimestamp = new Date().toISOString();
    const recordsToUpsert = netsuiteData.map((item: any) => {
      // REST API 返回的實際欄位結構（根據測試結果）
      const periodName = item.periodName || '';
      const startDate = item.startDate || null;
      const endDate = item.endDate || null;
      const isQuarter = item.isQuarter === true || false;
      const isYear = item.isYear === true || false;
      // ⚠️ 注意：實際資料庫有 is_adjustment 欄位，但 REST API 中沒有此欄位，設為 false
      const isAdjustment = false;
      const isClosed = item.closed === true || false; // 注意：實際欄位名是 closed，不是 isClosed

      // 只寫入實際資料庫存在的欄位
      // 實際資料庫欄位：id, netsuite_internal_id, period_name, start_date, end_date, 
      // is_quarter, is_year, is_adjustment, is_closed, sync_timestamp, created_at
      return {
        netsuite_internal_id: parseInt(item.id), // REST API 返回的 id 是字串，需轉換
        period_name: periodName,
        start_date: startDate,
        end_date: endDate,
        is_quarter: isQuarter,
        is_year: isYear,
        is_adjustment: isAdjustment, // 實際資料庫有此欄位，但 REST API 沒有，設為 false
        is_closed: isClosed, // 注意：實際欄位名是 closed，不是 isClosed
        sync_timestamp: syncTimestamp,
      };
    });

    console.log(`準備 Upsert ${recordsToUpsert.length} 筆記錄到 Supabase...`);

    // 執行 Upsert
    const { data: upsertedData, error: upsertError } = await supabase
      .from('ns_accounting_periods')
      .upsert(recordsToUpsert, {
        onConflict: 'netsuite_internal_id',
        ignoreDuplicates: false,
      })
      .select();

    if (upsertError) {
      console.error('Accounting Periods Upsert 錯誤:', upsertError);
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
      message: `成功同步 ${upsertedData?.length || 0} 筆 Accounting Period 資料`,
      data: {
        totalRecords: netsuiteData.length,
        upsertedRecords: upsertedData?.length || 0,
        timeTaken: `${timeTaken}ms`,
      },
    });
  } catch (error: any) {
    console.error('同步 Accounting Periods 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '同步失敗',
        message: error.message || '同步 Accounting Periods 時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { getTableSyncStatus } = await import('@/lib/sync-utils');
  const status = await getTableSyncStatus('ns_accounting_periods');
  return NextResponse.json(status);
}

