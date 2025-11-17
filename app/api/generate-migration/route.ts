import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 生成 Supabase ALTER TABLE 語句
 * 
 * 根據 field_mapping_config 中待確認的新欄位，生成對應的 ALTER TABLE 語句
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mappingKey, fieldIds } = body;

    if (!mappingKey && !fieldIds) {
      return NextResponse.json(
        {
          success: false,
          error: '請提供 mappingKey 或 fieldIds',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. 取得欄位映射配置
    let query = supabase
      .from('field_mapping_config')
      .select(`
        *,
        table_mapping:table_mapping_config(
          supabase_table_name
        )
      `);

    if (fieldIds && Array.isArray(fieldIds)) {
      query = query.in('id', fieldIds);
    } else if (mappingKey) {
      query = query.eq('mapping_key', mappingKey).eq('is_active', false);
    }

    const { data: fieldMappings, error: queryError } = await query;

    if (queryError) {
      return NextResponse.json(
        {
          success: false,
          error: '查詢欄位映射失敗',
          details: queryError,
        },
        { status: 500 }
      );
    }

    if (!fieldMappings || fieldMappings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '沒有找到待處理的欄位映射',
        },
        { status: 404 }
      );
    }

    // 2. 按表分組
    const tableGroups: Record<string, any[]> = {};
    fieldMappings.forEach((mapping: any) => {
      const tableName = mapping.table_mapping?.supabase_table_name;
      if (!tableName) {
        return;
      }

      if (!tableGroups[tableName]) {
        tableGroups[tableName] = [];
      }

      tableGroups[tableName].push(mapping);
    });

    // 3. 生成 ALTER TABLE 語句
    const migrations: Array<{
      tableName: string;
      sql: string;
      fields: any[];
    }> = [];

    Object.entries(tableGroups).forEach(([tableName, mappings]) => {
      const alterStatements: string[] = [];

      mappings.forEach((mapping: any) => {
        const columnName = mapping.supabase_column_name;
        const columnType = mapSupabaseType(mapping.supabase_column_type);
        
        // 檢查是否為可空欄位（預設為可空，除非明確標記為必填）
        const nullable = mapping.is_required ? 'NOT NULL' : 'NULL';

        alterStatements.push(
          `ADD COLUMN IF NOT EXISTS ${columnName} ${columnType} ${nullable}`
        );
      });

      if (alterStatements.length > 0) {
        migrations.push({
          tableName,
          sql: `ALTER TABLE ${tableName}\n  ${alterStatements.join(',\n  ')};`,
          fields: mappings,
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        migrations,
        totalTables: migrations.length,
        totalFields: fieldMappings.length,
      },
    });
  } catch (error: any) {
    console.error('生成遷移語句錯誤:', error);
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
 * 執行遷移（實際執行 ALTER TABLE）
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { migrationSql, fieldIds } = body;

    if (!migrationSql) {
      return NextResponse.json(
        {
          success: false,
          error: '請提供 migrationSql',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 執行 SQL（使用 Supabase RPC 或直接執行）
    // 注意：Supabase 的 REST API 不支援直接執行 DDL，需要使用 Supabase Client 或 RPC
    // 這裡我們使用 Supabase 的 execute SQL 功能（如果有 RPC 函數）

    // 方案 A：使用 Supabase Admin API（需要 service_role key）
    // 方案 B：提供 SQL 語句給使用者手動執行
    // 方案 C：建立 RPC 函數來執行 ALTER TABLE

    // 暫時返回 SQL 語句，讓使用者手動執行
    // 後續可以實作 RPC 函數來自動執行

    // 更新欄位映射狀態為已啟用
    if (fieldIds && Array.isArray(fieldIds)) {
      const { error: updateError } = await supabase
        .from('field_mapping_config')
        .update({ is_active: true })
        .in('id', fieldIds);

      if (updateError) {
        console.error('更新欄位映射狀態失敗:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      message: '遷移 SQL 已生成，請手動執行',
      data: {
        sql: migrationSql,
        note: '請在 Supabase SQL Editor 中執行上述 SQL 語句',
      },
    });
  } catch (error: any) {
    console.error('執行遷移錯誤:', error);
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
 * 映射 Supabase 型別
 */
function mapSupabaseType(type: string): string {
  const typeMap: Record<string, string> = {
    text: 'TEXT',
    integer: 'INTEGER',
    bigint: 'BIGINT',
    boolean: 'BOOLEAN',
    timestamp: 'TIMESTAMPTZ',
    numeric: 'NUMERIC(15,2)',
    jsonb: 'JSONB',
    date: 'DATE',
    uuid: 'UUID',
  };

  return typeMap[type.toLowerCase()] || 'TEXT';
}

