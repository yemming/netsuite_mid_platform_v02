/**
 * Server-only 表映射配置讀取
 * 
 * 此檔案只能在 Server Component 或 API Route 中使用
 * 因為它使用了 @/utils/supabase/server（需要 next/headers）
 * 
 * 注意：此檔案使用 'use server' directive，確保只能在 server-side 執行
 */

'use server'

import type { TableMapping } from './table-mapping';

/**
 * 從資料庫讀取表映射配置（Server-only）
 */
export async function loadTableMappingsFromDB(): Promise<TableMapping[] | null> {
  try {
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('table_mapping_config')
      .select('*')
      .eq('is_enabled', true)
      .order('sync_order', { ascending: true, nullsFirst: false });
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    // 轉換為 TableMapping 格式
    return data.map((row: any) => ({
      tableName: row.supabase_table_name,
      label: row.label,
      apiRoute: row.api_route,
      priority: row.priority as TableMapping['priority'],
      disabled: !row.is_enabled,
      disabledReason: row.disabled_reason || undefined,
      conflictColumn: row.conflict_column,
      netsuiteTable: row.netsuite_table,
      dependsOn: row.depends_on || [],
      syncOrder: row.sync_order,
    }));
  } catch (error) {
    console.warn('無法從資料庫讀取表映射配置，使用 fallback:', error);
    return null;
  }
}

