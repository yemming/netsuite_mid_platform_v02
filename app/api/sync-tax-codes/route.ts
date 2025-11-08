import { NextResponse } from 'next/server';
import { executeSync } from '@/lib/sync-utils';

/**
 * 同步 Tax Codes（稅碼）
 */
export async function POST() {
  const config = {
    tableName: 'ns_tax_codes',
    suiteqlQuery: `
      SELECT 
        id,
        itemid,
        fullname,
        rate,
        description,
        parent,
        taxaccount,
        saleaccount,
        isinactive
      FROM salestaxitem
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';

      return {
        netsuite_internal_id: parseInt(item.id),
        name: item.itemid || '', // itemid 是實際欄位名
        full_name: item.fullname || null,
        rate: item.rate ? parseFloat(item.rate) : null,
        description: item.description || null,
        parent_id: item.parent ? parseInt(item.parent) : null,
        tax_account_id: item.taxaccount ? parseInt(item.taxaccount) : null,
        sale_account_id: item.saleaccount ? parseInt(item.saleaccount) : null,
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
  const status = await getTableSyncStatus('ns_tax_codes');
  return NextResponse.json(status);
}

