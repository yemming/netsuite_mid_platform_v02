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
        email,
        department,
        subsidiary,
        isinactive
      FROM employee
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';
      // 注意：NetSuite SuiteQL 的 employee 表沒有 fullname 欄位，需要自己組合
      const name = `${item.firstname || ''} ${item.lastname || ''}`.trim() || item.entityid || '';

      return {
        netsuite_internal_id: parseInt(item.id),
        entity_id: item.entityid || null,
        name: name,
        // 注意：ns_entities_employees 表中沒有 first_name, last_name, title, hire_date 欄位
        email: item.email || null,
        department_id: item.department ? parseInt(item.department) : null,
        subsidiary_id: item.subsidiary ? parseInt(item.subsidiary) : null,
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

