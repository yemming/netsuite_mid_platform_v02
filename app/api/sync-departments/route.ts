import { NextResponse } from 'next/server';
import { executeSync } from '@/lib/sync-utils';

/**
 * 同步 Departments（部門）
 */
export async function POST() {
  const config = {
    tableName: 'ns_departments',
    suiteqlQuery: `
      SELECT 
        id,
        name,
        subsidiary,
        parent,
        fullname,
        isinactive
      FROM department
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';

      return {
        netsuite_internal_id: parseInt(item.id),
        name: item.name || '',
        subsidiary_ids: item.subsidiary || null, // 字串列表 "1, 3, 4"
        parent_id: item.parent ? parseInt(item.parent) : null,
        full_name: item.fullname || null,
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
  const status = await getTableSyncStatus('ns_departments');
  return NextResponse.json(status);
}

