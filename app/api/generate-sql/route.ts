import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * SQL 生成器 API
 * 
 * 根據映射配置生成 CREATE TABLE 或 UPSERT SQL 語句
 */

interface MappingRule {
  sourceField: string;
  targetField: string;
  transformType: 'direct' | 'default' | 'vlookup' | 'aggregate' | 'expression';
  transformConfig?: any;
  sourceType?: string;
  targetType: string;
}

interface SQLGenerationRequest {
  targetTable: string;
  mappings: MappingRule[];
  primaryKey?: string;
  createIfNotExists?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: SQLGenerationRequest = await request.json();
    const { targetTable, mappings, primaryKey, createIfNotExists = true } = body;

    if (!targetTable || !mappings || mappings.length === 0) {
      return NextResponse.json(
        { success: false, error: '請提供 targetTable 和 mappings' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 檢查表是否存在
    const tableExists = await checkTableExists(targetTable);

    let sql = '';
    let mode = '';

    if (!tableExists && createIfNotExists) {
      // Scenario A: 表不存在，生成 CREATE TABLE + INSERT
      mode = 'create';
      sql = generateCreateTableSQL(targetTable, mappings, primaryKey);
    } else if (tableExists) {
      // Scenario B: 表已存在，生成 UPSERT 或 ALTER TABLE
      mode = 'upsert';
      const alterSQL = await generateAlterTableSQL(targetTable, mappings);
      const upsertSQL = generateUpsertSQL(targetTable, mappings, primaryKey);
      sql = alterSQL ? `${alterSQL}\n\n${upsertSQL}` : upsertSQL;
    } else {
      return NextResponse.json(
        { success: false, error: '表不存在且未啟用自動建立' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        mode,
        tableExists,
        sql,
        mappings: mappings.length,
      },
    });
  } catch (error: any) {
    console.error('SQL 生成錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '生成 SQL 失敗',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * 檢查表是否存在
 */
async function checkTableExists(tableName: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_table_columns', {
    target_table: tableName,
  });

  return !error && data && data.length > 0;
}

/**
 * 生成 CREATE TABLE SQL
 */
function generateCreateTableSQL(
  tableName: string,
  mappings: MappingRule[],
  primaryKey?: string
): string {
  const columns: string[] = [];

  // 添加系統欄位
  columns.push('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY');
  columns.push('  created_at TIMESTAMPTZ DEFAULT NOW()');
  columns.push('  updated_at TIMESTAMPTZ DEFAULT NOW()');
  columns.push('  sync_timestamp TIMESTAMPTZ DEFAULT NOW()');

  // 添加映射欄位
  mappings.forEach((mapping) => {
    const columnDef = `  ${mapping.targetField} ${postgresType(mapping.targetType)}`;
    columns.push(columnDef);
  });

  const sql = `-- 自動生成的表結構
CREATE TABLE IF NOT EXISTS ${tableName} (
${columns.join(',\n')}
);

-- 建立索引
${primaryKey ? `CREATE INDEX IF NOT EXISTS idx_${tableName}_${primaryKey} ON ${tableName}(${primaryKey});` : ''}
CREATE INDEX IF NOT EXISTS idx_${tableName}_sync_timestamp ON ${tableName}(sync_timestamp DESC);

-- 建立更新觸發器
CREATE OR REPLACE FUNCTION update_${tableName}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_${tableName}_updated_at
  BEFORE UPDATE ON ${tableName}
  FOR EACH ROW
  EXECUTE FUNCTION update_${tableName}_updated_at();`;

  return sql;
}

/**
 * 生成 ALTER TABLE SQL（添加新欄位）
 */
async function generateAlterTableSQL(
  tableName: string,
  mappings: MappingRule[]
): Promise<string> {
  const supabase = await createClient();

  // 取得現有欄位
  const { data: existingColumns } = await supabase.rpc('get_table_columns', {
    target_table: tableName,
  });

  if (!existingColumns) return '';

  const existingColumnNames = new Set(
    existingColumns.map((col: any) => col.column_name)
  );

  // 找出需要新增的欄位
  const newColumns = mappings.filter(
    (mapping) => !existingColumnNames.has(mapping.targetField)
  );

  if (newColumns.length === 0) return '';

  const alterStatements = newColumns.map(
    (mapping) =>
      `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${mapping.targetField} ${postgresType(mapping.targetType)};`
  );

  return `-- 新增欄位\n${alterStatements.join('\n')}`;
}

/**
 * 生成 UPSERT SQL
 */
function generateUpsertSQL(
  tableName: string,
  mappings: MappingRule[],
  primaryKey?: string
): string {
  const columns = mappings.map((m) => m.targetField);
  const placeholders = mappings.map((_, i) => `$${i + 1}`);

  const updateSet = columns
    .filter((col) => col !== primaryKey)
    .map((col) => `${col} = EXCLUDED.${col}`)
    .join(',\n    ');

  const sql = `-- UPSERT 語句（使用參數化查詢）
INSERT INTO ${tableName} (
  ${columns.join(',\n  ')},
  sync_timestamp
)
VALUES (
  ${placeholders.join(',\n  ')},
  NOW()
)
${
  primaryKey
    ? `ON CONFLICT (${primaryKey}) 
DO UPDATE SET
    ${updateSet},
    updated_at = NOW(),
    sync_timestamp = NOW();`
    : ';'
}`;

  return sql;
}

/**
 * 轉換為 PostgreSQL 型別
 */
function postgresType(type: string): string {
  const typeMap: Record<string, string> = {
    text: 'TEXT',
    string: 'TEXT',
    varchar: 'VARCHAR(255)',
    integer: 'INTEGER',
    int: 'INTEGER',
    bigint: 'BIGINT',
    number: 'NUMERIC(18, 2)',
    numeric: 'NUMERIC(18, 2)',
    decimal: 'DECIMAL(18, 2)',
    boolean: 'BOOLEAN',
    bool: 'BOOLEAN',
    date: 'DATE',
    timestamp: 'TIMESTAMPTZ',
    timestamptz: 'TIMESTAMPTZ',
    json: 'JSONB',
    jsonb: 'JSONB',
  };

  return typeMap[type.toLowerCase()] || 'TEXT';
}

