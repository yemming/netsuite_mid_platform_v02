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
    
    // 格式化為前端需要的格式（使用 snake_case 以符合前端期望）
    const formattedMappings = mappings.map((mapping: any) => {
      // 優先使用從資料庫讀取的 mapping_key，否則從 tableName 提取
      const mappingKey = mapping.mappingKey || mapping.tableName.replace(/^ns_/, '');
      
      return {
        mapping_key: mappingKey,
        supabase_table_name: mapping.tableName, // 例如：ns_subsidiaries
        netsuite_table_name: mapping.netsuiteTable, // 例如：subsidiary
        label: mapping.label, // 例如：公司別
        api_route: mapping.apiRoute, // 例如：/api/sync-subsidiaries
        priority: mapping.priority,
        conflict_column: mapping.conflictColumn,
        depends_on: mapping.dependsOn || [],
        sync_order: mapping.syncOrder || 999,
        is_enabled: !mapping.disabled, // disabled 的相反值
        disabled_reason: mapping.disabledReason || null,
      };
    }).sort((a, b) => (a.sync_order || 999) - (b.sync_order || 999)); // 按照同步順序排序

    return NextResponse.json({
      success: true,
      data: {
        mappings: formattedMappings, // 包裝在 mappings 物件中
      },
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

