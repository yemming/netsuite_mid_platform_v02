import { NextResponse } from 'next/server';
import { executeSync } from '@/lib/sync-utils';

/**
 * 同步 Accounts（會計科目）
 */
export async function POST() {
  const config = {
    tableName: 'ns_accounts',
    suiteqlQuery: `
      SELECT 
        id,
        accountsearchdisplayname,
        displaynamewithhierarchy,
        accttype,
        subsidiary,
        parent,
        issummary,
        isinactive
      FROM account
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';
      const isSummary = item.issummary === 'T';

      return {
        netsuite_internal_id: parseInt(item.id),
        account_search_display_name: item.accountsearchdisplayname || null,
        display_name_with_hierarchy: item.displaynamewithhierarchy || null,
        acct_type: item.accttype || null,
        subsidiary_ids: item.subsidiary || null, // 字串列表
        parent_id: item.parent ? parseInt(item.parent) : null,
        is_summary: isSummary,
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
  const status = await getTableSyncStatus('ns_accounts');
  return NextResponse.json(status);
}

