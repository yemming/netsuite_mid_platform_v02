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
        // 注意：ns_tax_codes 表中沒有 full_name、parent_id、tax_account_id、sale_account_id、updated_at 欄位
        rate: item.rate ? parseFloat(item.rate) : null,
        description: item.description || null,
        is_inactive: !isActive,
        sync_timestamp: syncTimestamp,
        // 注意：ns_tax_codes 表中沒有 updated_at 欄位
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

