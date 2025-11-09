import { NextResponse } from 'next/server';
import { executeSync } from '@/lib/sync-utils';

/**
 * 同步 Terms（付款條件）
 */
export async function POST() {
  const config = {
    tableName: 'ns_terms',
    suiteqlQuery: `
      SELECT 
        id,
        name,
        daysuntilnetdue,
        discountpercent,
        daysuntilexpiry,
        datedriven,
        isinactive
      FROM term
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';
      // 注意：ns_terms 表中沒有 is_date_driven 和 updated_at 欄位

      return {
        netsuite_internal_id: parseInt(item.id),
        name: item.name || '',
        days_until_net_due: item.daysuntilnetdue ? parseInt(item.daysuntilnetdue) : null,
        discount_percent: item.discountpercent ? parseFloat(item.discountpercent) : null,
        days_until_expiry: item.daysuntilexpiry ? parseInt(item.daysuntilexpiry) : null,
        // 注意：ns_terms 表中沒有 is_date_driven 欄位
        is_inactive: !isActive,
        sync_timestamp: syncTimestamp,
        // 注意：ns_terms 表中沒有 updated_at 欄位
      };
    },
    conflictColumn: 'netsuite_internal_id',
  };

  const result = await executeSync(config);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function GET() {
  const { getTableSyncStatus } = await import('@/lib/sync-utils');
  const status = await getTableSyncStatus('ns_terms');
  return NextResponse.json(status);
}

