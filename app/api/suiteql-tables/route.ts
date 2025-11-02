import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function getDefaultTables() {
  return [
    { recordType: 'customer', suiteQLTable: 'customer', recordCount: 0, status: 'available' },
    { recordType: 'item', suiteQLTable: 'item', recordCount: 0, status: 'available' },
    { recordType: 'currency', suiteQLTable: 'currency', recordCount: 0, status: 'available' },
    { recordType: 'subsidiary', suiteQLTable: 'subsidiary', recordCount: 0, status: 'available' },
    { recordType: 'department', suiteQLTable: 'department', recordCount: 0, status: 'available' },
    { recordType: 'location', suiteQLTable: 'location', recordCount: 0, status: 'available' },
    { recordType: 'classification', suiteQLTable: 'classification', recordCount: 0, status: 'available' },
    { recordType: 'employee', suiteQLTable: 'employee', recordCount: 0, status: 'available' },
    { recordType: 'vendor', suiteQLTable: 'vendor', recordCount: 0, status: 'available' },
    { recordType: 'contact', suiteQLTable: 'contact', recordCount: 0, status: 'available' },
    { recordType: 'transaction', suiteQLTable: 'transaction', recordCount: 0, hasMore: false, status: 'available' },
    { recordType: 'salesorder', suiteQLTable: 'transaction', status: 'transaction', note: "使用 WHERE type = 'SalesOrd'", transactionType: 'SalesOrd' },
    { recordType: 'invoice', suiteQLTable: 'transaction', status: 'transaction', note: "使用 WHERE type = 'CustInvc'", transactionType: 'CustInvc' },
  ];
}

export async function GET() {
  try {
    const supabase = await createClient();

    // 從 Supabase 讀取表格映射資料
    const { data, error } = await supabase
      .from('suiteql_tables_reference')
      .select('*')
      .order('record_type');

    if (error) {
      console.error('Supabase 查詢失敗:', error);
      // 如果表不存在，返回預設資料
      return NextResponse.json({
        generatedAt: new Date().toISOString(),
        totalRecordTypes: getDefaultTables().length,
        availableTables: getDefaultTables().filter((t: any) => t.status === 'available').length,
        unavailableTables: 0,
        transactionTypes: getDefaultTables().filter((t: any) => t.status === 'transaction').length,
        tables: {
          all: getDefaultTables(),
        },
      });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        generatedAt: new Date().toISOString(),
        totalRecordTypes: getDefaultTables().length,
        availableTables: getDefaultTables().filter((t: any) => t.status === 'available').length,
        unavailableTables: 0,
        transactionTypes: getDefaultTables().filter((t: any) => t.status === 'transaction').length,
        tables: {
          all: getDefaultTables(),
        },
      });
    }

    // 轉換資料格式
    const allTables = data.map((item: any) => {
      let status: 'available' | 'transaction' | 'unavailable' = 'available';
      
      if (item.category === 'transaction') {
        status = 'transaction';
      } else if (item.is_available === false) {
        status = 'unavailable';
      }

      let note = '';
      if (status === 'transaction' && item.transaction_type) {
        note = `使用 WHERE type = '${item.transaction_type}'`;
      } else if (status === 'available') {
        note = '直接使用表格名稱查詢';
      }

      return {
        recordType: item.record_type,
        suiteQLTable: item.suiteql_table,
        recordCount: item.record_count !== null && item.record_count !== undefined ? item.record_count : null,
        hasMore: item.record_count !== null && item.record_count !== undefined && item.record_count >= 1000,
        status,
        note,
        isSubscribed: item.is_subscribed || false,
        category: item.category,
        transactionType: item.transaction_type,
      };
    });

    // 計算統計資訊
    const stats = {
      total: allTables.length,
      available: allTables.filter((t: any) => t.status === 'available').length,
      transaction: allTables.filter((t: any) => t.status === 'transaction').length,
      unavailable: allTables.filter((t: any) => t.status === 'unavailable').length,
    };

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      totalRecordTypes: stats.total,
      availableTables: stats.available,
      unavailableTables: stats.unavailable,
      transactionTypes: stats.transaction,
      tables: {
        all: allTables,
      },
    });
  } catch (error: any) {
    console.error('讀取映射表失敗:', error);
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      totalRecordTypes: getDefaultTables().length,
      availableTables: getDefaultTables().filter((t: any) => t.status === 'available').length,
      unavailableTables: 0,
      transactionTypes: getDefaultTables().filter((t: any) => t.status === 'transaction').length,
      tables: {
        all: getDefaultTables(),
      },
    });
  }
}

// 更新訂閱狀態
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { recordType, isSubscribed } = body;

    if (!recordType || typeof isSubscribed !== 'boolean') {
      return NextResponse.json(
        { error: 'recordType 和 isSubscribed 都是必需的' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('suiteql_tables_reference')
      .update({ 
        is_subscribed: isSubscribed,
        updated_at: new Date().toISOString(),
      })
      .eq('record_type', recordType)
      .select()
      .single();

    if (error) {
      console.error('更新訂閱狀態失敗:', error);
      return NextResponse.json(
        { error: `更新訂閱狀態失敗: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recordType,
      isSubscribed,
    });
  } catch (error: any) {
    console.error('更新訂閱狀態錯誤:', error);
    return NextResponse.json(
      { error: `更新訂閱狀態錯誤: ${error.message}` },
      { status: 500 }
    );
  }
}

