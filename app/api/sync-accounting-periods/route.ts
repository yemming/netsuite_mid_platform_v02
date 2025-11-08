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

    const netsuiteData = result.items || [];
    console.log(`從 NetSuite 取得 ${netsuiteData.length} 筆 Accounting Period 資料`);

    if (netsuiteData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '無資料',
          message: 'NetSuite 中沒有找到任何 Accounting Period 資料',
        },
        { status: 404 }
      );
    }

    // 轉換資料格式
    const syncTimestamp = new Date().toISOString();
    const recordsToUpsert = netsuiteData.map((item: any) => {
      // REST API 返回的資料結構（根據實際 API 回應）
      // 注意：實際欄位名是 closed（不是 isClosed），且 isAdjustment 不存在
      const periodName = item.periodName || item.name || '';
      const startDate = item.startDate || item.startdate || null;
      const endDate = item.endDate || item.enddate || null;
      const isQuarter = item.isQuarter === true || item.isquarter === 'T' || false;
      const isYear = item.isYear === true || item.isyear === 'T' || false;
      const isClosed = item.closed === true || item.isClosed === true || item.isclosed === 'T' || false; // 注意：實際欄位名是 closed
      const fiscalCalendarId = item.fiscalCalendar?.id ? parseInt(item.fiscalCalendar.id) : null;

      return {
        netsuite_internal_id: parseInt(item.id), // REST API 返回的 id 是字串，需轉換
        period_name: periodName,
        start_date: startDate,
        end_date: endDate,
        is_quarter: isQuarter,
        is_year: isYear,
        // is_adjustment 欄位不存在於 REST API，已移除
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

