import { NextResponse } from 'next/server';
import { executeSync } from '@/lib/sync-utils';

/**
 * 同步 Employees（員工）
 */
export async function POST() {
  const config = {
    tableName: 'ns_entities_employees',
    suiteqlQuery: `
      SELECT 
        id,
        entityid,
        firstname,
        lastname,
        fullname,
        email,
        title,
        department,
        subsidiary,
        hiredate,
        isinactive
      FROM employee
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';
      const name = item.fullname || `${item.firstname || ''} ${item.lastname || ''}`.trim() || '';

      return {
        netsuite_internal_id: parseInt(item.id),
        entity_id: item.entityid || null,
        first_name: item.firstname || null,
        last_name: item.lastname || null,
        name: name,
        email: item.email || null,
        title: item.title || null,
        department_id: item.department ? parseInt(item.department) : null,
        subsidiary_id: item.subsidiary ? parseInt(item.subsidiary) : null,
        hire_date: item.hiredate || null,
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
  const status = await getTableSyncStatus('ns_entities_employees');
  return NextResponse.json(status);
}

