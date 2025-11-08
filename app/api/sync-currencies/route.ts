import { NextResponse } from 'next/server';
import { executeSync } from '@/lib/sync-utils';

/**
 * 同步 Currencies（幣別）
 */
export async function POST() {
  const config = {
    tableName: 'ns_currencies',
    suiteqlQuery: `
      SELECT 
        id,
        name,
        symbol,
        exchangerate,
        isbasecurrency,
        isinactive
      FROM currency
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';
      const isBaseCurrency = item.isbasecurrency === 'T';

      return {
        netsuite_internal_id: parseInt(item.id),
        name: item.name || '',
        symbol: item.symbol || null,
        exchange_rate: item.exchangerate ? parseFloat(item.exchangerate) : null,
        is_base_currency: isBaseCurrency,
        is_active: isActive,
        sync_timestamp: syncTimestamp,
        updated_at: syncTimestamp,
      };
    },
    conflictColumn: 'netsuite_internal_id',
  };

  const result = await executeSync(config);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

/**
 * GET 方法：查詢同步狀態
 */
export async function GET() {
  const { getTableSyncStatus } = await import('@/lib/sync-utils');
  const status = await getTableSyncStatus('ns_currencies');
  return NextResponse.json(status);
}

