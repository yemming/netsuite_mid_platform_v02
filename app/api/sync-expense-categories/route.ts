import { NextResponse } from 'next/server';
import { executeSync } from '@/lib/sync-utils';

/**
 * 同步 Expense Categories（費用類別）
 */
export async function POST() {
  const config = {
    tableName: 'ns_expense_categories',
    suiteqlQuery: `
      SELECT 
        id,
        name,
        expenseacct,
        defaultrate,
        raterequired,
        isinactive
      FROM expensecategory
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';

      return {
        netsuite_internal_id: parseInt(item.id),
        name: item.name || '',
        expense_account_id: item.expenseacct ? parseInt(item.expenseacct) : null,
        // 注意：ns_expense_categories 表中沒有 default_rate、rate_required、subsidiary_ids 欄位
        is_inactive: !isActive,
        sync_timestamp: syncTimestamp,
      };
    },
    conflictColumn: 'netsuite_internal_id',
  };

  const result = await executeSync(config);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function GET() {
  const { getTableSyncStatus } = await import('@/lib/sync-utils');
  const status = await getTableSyncStatus('ns_expense_categories');
  return NextResponse.json(status);
}

