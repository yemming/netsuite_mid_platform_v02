import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 取得 Supabase 表的所有欄位
 * GET /api/field-mapping/supabase-columns?tableName=ns_customers
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('tableName');

    if (!tableName) {
      return NextResponse.json(
        {
          success: false,
          error: '請提供 tableName',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 使用 RPC 函數查詢表結構
    const { data: columnsData, error: rpcError } = await supabase.rpc('get_table_columns', {
      table_name_param: tableName,
    });

    if (rpcError) {
      // 如果 RPC 函數不存在或任何錯誤，使用標準欄位列表（fallback）
      console.warn('⚠️ RPC 函數錯誤，使用標準欄位列表:', rpcError.message || rpcError.code);
      
      // 標準 Supabase 表結構（fallback）
      const standardColumnsMap: Record<string, Array<{ name: string; type: string; nullable: boolean }>> = {
          'ns_subsidiaries': [
            { name: 'id', type: 'uuid', nullable: false },
            { name: 'netsuite_internal_id', type: 'integer', nullable: false },
            { name: 'name', type: 'text', nullable: false },
            { name: 'legal_name', type: 'text', nullable: true },
            { name: 'full_name', type: 'text', nullable: true },
            { name: 'country', type: 'text', nullable: true },
            { name: 'state', type: 'text', nullable: true },
            { name: 'email', type: 'text', nullable: true },
            { name: 'base_currency_id', type: 'integer', nullable: true },
            { name: 'parent_id', type: 'integer', nullable: true },
            { name: 'fiscal_calendar_id', type: 'integer', nullable: true },
            { name: 'is_elimination', type: 'boolean', nullable: false },
            { name: 'is_active', type: 'boolean', nullable: false },
            { name: 'sync_timestamp', type: 'timestamp', nullable: true },
            { name: 'created_at', type: 'timestamp', nullable: false },
            { name: 'updated_at', type: 'timestamp', nullable: false },
          ],
          'ns_subsidiary': [
            { name: 'id', type: 'bigint', nullable: false },
            { name: 'full_name', type: 'text', nullable: false },
            { name: 'name', type: 'text', nullable: true },
            { name: 'country', type: 'text', nullable: true },
            { name: 'currency', type: 'text', nullable: true },
            { name: 'edition', type: 'text', nullable: true },
            { name: 'email', type: 'text', nullable: true },
            { name: 'fiscal_calendar', type: 'text', nullable: true },
            { name: 'is_elimination', type: 'boolean', nullable: false },
            { name: 'is_inactive', type: 'boolean', nullable: false },
            { name: 'language', type: 'text', nullable: true },
            { name: 'legal_name', type: 'text', nullable: true },
            { name: 'logo', type: 'text', nullable: true },
            { name: 'state', type: 'text', nullable: true },
            { name: 'parent', type: 'bigint', nullable: true },
            { name: 'purchase_order_amount', type: 'numeric', nullable: true },
            { name: 'purchase_order_quantity', type: 'numeric', nullable: true },
            { name: 'receipt_amount', type: 'numeric', nullable: true },
            { name: 'receipt_quantity', type: 'numeric', nullable: true },
            { name: 'sync_timestamp', type: 'timestamptz', nullable: true },
            { name: 'created_at', type: 'timestamptz', nullable: false },
            { name: 'updated_at', type: 'timestamptz', nullable: false },
          ],
          'ns_entities_customers': [
            { name: 'id', type: 'uuid', nullable: false },
            { name: 'netsuite_internal_id', type: 'integer', nullable: false },
            { name: 'entity_id', type: 'text', nullable: true },
            { name: 'company_name', type: 'text', nullable: true },
            { name: 'email', type: 'text', nullable: true },
            { name: 'is_active', type: 'boolean', nullable: false },
            { name: 'sync_timestamp', type: 'timestamp', nullable: true },
            { name: 'created_at', type: 'timestamp', nullable: false },
            { name: 'updated_at', type: 'timestamp', nullable: false },
          ],
          'ns_items': [
            { name: 'id', type: 'uuid', nullable: false },
            { name: 'netsuite_internal_id', type: 'integer', nullable: false },
            { name: 'item_id', type: 'text', nullable: true },
            { name: 'display_name', type: 'text', nullable: true },
            { name: 'type', type: 'text', nullable: true },
            { name: 'is_active', type: 'boolean', nullable: false },
            { name: 'sync_timestamp', type: 'timestamp', nullable: true },
            { name: 'created_at', type: 'timestamp', nullable: false },
            { name: 'updated_at', type: 'timestamp', nullable: false },
          ],
        };

        const standardColumns = standardColumnsMap[tableName] || [];
        
        if (standardColumns.length > 0) {
          return NextResponse.json({
            success: true,
            data: {
              tableName,
              columns: standardColumns,
              total: standardColumns.length,
              message: '使用標準欄位列表（請在 Supabase 中執行 create_get_table_columns_function.sql 來啟用實際查詢）',
              needsSetup: true,
            },
          });
        } else {
          // 如果沒有標準欄位列表，返回錯誤
          return NextResponse.json(
            {
              success: false,
              error: '查詢表結構失敗',
              details: rpcError,
              message: `找不到表 ${tableName} 的標準欄位列表，請確認表名正確或手動新增欄位`,
            },
            { status: 500 }
          );
        }
      }

    // 轉換資料格式
    const columns = (columnsData || []).map((col: any) => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable === 'YES',
      default: col.column_default || undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        tableName,
        columns,
        total: columns.length,
      },
    });
  } catch (error: any) {
    console.error('取得 Supabase 欄位錯誤:', error);
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

