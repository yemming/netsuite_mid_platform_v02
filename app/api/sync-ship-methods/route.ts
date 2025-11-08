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
        description,
        displayname,
        servicecode,
        isinactive
      FROM shipitem
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';

      return {
        netsuite_internal_id: parseInt(item.id),
        name: item.itemid || '', // itemid 是實際欄位名
        description: item.description || null,
        display_name: item.displayname || null,
        service_code: item.servicecode || null,
        is_inactive: !isActive,
        sync_timestamp: syncTimestamp,
        updated_at: syncTimestamp,
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

