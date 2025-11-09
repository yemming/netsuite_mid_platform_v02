import { NextResponse } from 'next/server';
import { executeSync } from '@/lib/sync-utils';

/**
 * 同步 Ship Methods（運送方式）
 */
export async function POST() {
  const config = {
    tableName: 'ns_ship_methods',
    suiteqlQuery: `
      SELECT 
        id,
        itemid,
        isinactive
      FROM shipitem
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';

      return {
        netsuite_internal_id: parseInt(item.id),
        name: item.itemid || '', // itemid 是實際欄位名
        // 注意：ns_ship_methods 表中沒有 description, display_name, service_code, updated_at 欄位
        is_inactive: !isActive,
        sync_timestamp: syncTimestamp,
      };
    },
    conflictColumn: 'netsuite_internal_id',
  };

  const result = await executeSync(config);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function GET() {
  const { getTableSyncStatus } = await import('@/lib/sync-utils');
  const status = await getTableSyncStatus('ns_ship_methods');
  return NextResponse.json(status);
}

