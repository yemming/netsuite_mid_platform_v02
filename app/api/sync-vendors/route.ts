import { NextResponse } from 'next/server';
import { executeSync } from '@/lib/sync-utils';

/**
 * 同步 Vendors（供應商）
 */
export async function POST() {
  const config = {
    tableName: 'ns_entities_vendors',
    suiteqlQuery: `
      SELECT 
        id,
        entityid,
        companyname,
        fullname,
        altname,
        isperson,
        email,
        phone,
        currency,
        terms,
        isinactive
      FROM vendor
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';
      const isPerson = item.isperson === 'T';
      const name = item.companyname || item.fullname || '';

      return {
        netsuite_internal_id: parseInt(item.id),
        entity_id: item.entityid || null,
        name: name,
        company_name: item.companyname || null,
        alt_name: item.altname || null,
        is_person: isPerson,
        email: item.email || null,
        phone: item.phone || null,
        currency_id: item.currency ? parseInt(item.currency) : null,
        terms_id: item.terms ? parseInt(item.terms) : null,
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
  const status = await getTableSyncStatus('ns_entities_vendors');
  return NextResponse.json(status);
}

