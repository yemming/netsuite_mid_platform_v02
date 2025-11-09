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
        subsidiary,
        isinactive
      FROM expensecategory
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';

      // 處理 subsidiary 欄位（字串列表，如 "1, 3, 4, 5"）
      let subsidiaryValue = null;
      if (item.subsidiary) {
        const subsidiaryStr = String(item.subsidiary).trim();
        if (subsidiaryStr.includes(',')) {
          // 如果是多個公司，取第一個
          const firstId = subsidiaryStr.split(',')[0].trim();
          subsidiaryValue = firstId ? parseInt(firstId) : null;
        } else {
          subsidiaryValue = parseInt(subsidiaryStr);
        }
      }

      return {
        netsuite_internal_id: parseInt(item.id),
        name: item.name || '',
        expense_account_id: item.expenseacct ? parseInt(item.expenseacct) : null,
        subsidiary_id: subsidiaryValue, // 所屬公司 ID（取第一個值）
        // 注意：ns_expense_categories 表中沒有 default_rate、rate_required 欄位
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

