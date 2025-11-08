import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';
import { createClient } from '@/utils/supabase/server';

/**
 * 直接從 NetSuite 同步 Subsidiary 資料到 Supabase
 * 不使用 n8n，直接在 Next.js 中處理
 */
export async function POST() {
  try {
    const startTime = Date.now();

    // 1. 初始化 NetSuite 客戶端
    const netsuite = getNetSuiteAPIClient();

    // 2. 初始化 Supabase 客戶端
    const supabase = await createClient();

    // 3. 從 NetSuite 查詢 Subsidiary 資料
    console.log('開始從 NetSuite 查詢 Subsidiary 資料...');
    
    const suiteqlQuery = `
      SELECT 
        id,
        name,
        legalname,
        country,
        currency,
        isinactive,
        fullname,
        parent,
        iselimination,
        state,
        email,
        fiscalcalendar
      FROM subsidiary
      ORDER BY id
    `;

    let netsuiteData;
    try {
      const result = await netsuite.executeSuiteQL(suiteqlQuery, { fetchAll: true });
      netsuiteData = result.items || [];
      console.log(`從 NetSuite 取得 ${netsuiteData.length} 筆 Subsidiary 資料`);
    } catch (netsuiteError: any) {
      console.error('NetSuite 查詢錯誤:', netsuiteError);
      return NextResponse.json(
        {
          success: false,
          error: 'NetSuite 查詢失敗',
          message: netsuiteError.message || '無法從 NetSuite 取得資料',
        },
        { status: 500 }
      );
    }

    if (netsuiteData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '無資料',
          message: 'NetSuite 中沒有找到任何 Subsidiary 資料',
        },
        { status: 404 }
      );
    }

    // 4. 轉換資料格式並準備 Upsert
    const syncTimestamp = new Date().toISOString();
    const recordsToUpsert = netsuiteData.map((item: any) => {
      // 轉換 NetSuite 的 'T'/'F' 為布林值
      const isActive = item.isinactive !== 'T'; // isinactive = 'F' 表示 active
      const isElimination = item.iselimination === 'T';

      return {
        netsuite_internal_id: parseInt(item.id),
        name: item.name || '',
        legal_name: item.legalname || null,
        country: item.country || null,
        base_currency_id: item.currency ? parseInt(item.currency) : null,
        parent_id: item.parent ? parseInt(item.parent) : null,
        full_name: item.fullname || null,
        is_elimination: isElimination,
        state: item.state || null,
        email: item.email || null,
        fiscal_calendar_id: item.fiscalcalendar ? parseInt(item.fiscalcalendar) : null,
        is_active: isActive,
        sync_timestamp: syncTimestamp,
        updated_at: syncTimestamp,
      };
    });

    console.log(`準備 Upsert ${recordsToUpsert.length} 筆記錄到 Supabase...`);

    // 5. 執行 Upsert（根據 netsuite_internal_id）
    const { data: upsertedData, error: upsertError } = await supabase
      .from('ns_subsidiaries')
      .upsert(recordsToUpsert, {
        onConflict: 'netsuite_internal_id',
        ignoreDuplicates: false,
      })
      .select();

    if (upsertError) {
      console.error('Supabase Upsert 錯誤:', upsertError);
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

    // 6. 返回成功結果
    return NextResponse.json({
      success: true,
      message: `成功同步 ${recordsToUpsert.length} 筆 Subsidiary 資料`,
      data: {
        totalRecords: recordsToUpsert.length,
        upsertedRecords: upsertedData?.length || 0,
        timeTaken: `${timeTaken}ms`,
        syncTimestamp,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('同步 Subsidiary 資料錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '伺服器錯誤',
        message: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

/**
 * GET 方法：查詢同步狀態
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 查詢最新的同步記錄
    const { data, error } = await supabase
      .from('ns_subsidiaries')
      .select('sync_timestamp, updated_at')
      .order('sync_timestamp', { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: '查詢失敗',
          message: error.message,
        },
        { status: 500 }
      );
    }

    // 統計總記錄數
    const { count } = await supabase
      .from('ns_subsidiaries')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: {
        totalRecords: count || 0,
        lastSyncTime: data && data.length > 0 ? data[0].sync_timestamp : null,
        lastUpdateTime: data && data.length > 0 ? data[0].updated_at : null,
      },
    });
  } catch (error: any) {
    console.error('查詢同步狀態錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '伺服器錯誤',
        message: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

