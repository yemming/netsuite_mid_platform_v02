import { NextResponse } from 'next/server';
import { getAllTableMappings } from '@/lib/table-mapping';

// 標記為動態路由（因為需要讀取資料庫）
export const dynamic = 'force-dynamic';

/**
 * 取得所有 Table Mapping 配置
 * 用於顯示 Supabase 表名與 NetSuite 表名的對應關係
 */
export async function GET() {
  try {
    const mappings = await getAllTableMappings();
    
    // 格式化為前端需要的格式
    const formattedMappings = mappings.map(mapping => ({
      mappingKey: mapping.tableName.replace(/^ns_|^[a-z0-9]+_/, ''), // 移除前綴，例如：subsidiaries
      supabaseTableName: mapping.tableName, // 例如：ns_subsidiaries
      netsuiteTableName: mapping.netsuiteTable, // 例如：subsidiary
      label: mapping.label, // 例如：公司別
      apiRoute: mapping.apiRoute, // 例如：/api/sync-subsidiaries
      priority: mapping.priority,
      conflictColumn: mapping.conflictColumn,
      dependsOn: mapping.dependsOn || [],
      syncOrder: mapping.syncOrder || 999,
      disabled: mapping.disabled || false,
      disabledReason: mapping.disabledReason || null,
    })).sort((a, b) => (a.syncOrder || 999) - (b.syncOrder || 999)); // 按照同步順序排序

    return NextResponse.json({
      success: true,
      data: formattedMappings,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: '查詢失敗',
        message: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

