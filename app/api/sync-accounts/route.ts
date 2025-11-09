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
      
      // NetSuite 的 subsidiary 可能是字串列表 "1, 3, 4" 或單一數字
      // 如果資料庫欄位是 subsidiary_id (INTEGER)，取第一個值
      // 如果資料庫欄位是 subsidiary_ids (TEXT)，保留字串格式
      let subsidiaryValue = null;
      if (item.subsidiary) {
        // 如果是字串列表，取第一個值轉為 INTEGER
        const subsidiaryStr = String(item.subsidiary).trim();
        if (subsidiaryStr.includes(',')) {
          // 字串列表格式 "1, 3, 4"，取第一個
          const firstId = subsidiaryStr.split(',')[0].trim();
          subsidiaryValue = firstId ? parseInt(firstId) : null;
        } else {
          // 單一數字
          subsidiaryValue = parseInt(subsidiaryStr);
        }
      }

      return {
        netsuite_internal_id: parseInt(item.id),
        // 注意：資料庫實際欄位是 acct_number 和 acct_name，不是 account_search_display_name 和 display_name_with_hierarchy
        // 使用 displaynamewithhierarchy 作為 acct_name（如果沒有則使用 accountsearchdisplayname）
        acct_name: item.displaynamewithhierarchy || item.accountsearchdisplayname || null,
        // full_name 使用 displaynamewithhierarchy（階層顯示名稱）
        full_name: item.displaynamewithhierarchy || null,
        acct_type: item.accttype || null,
        subsidiary_id: subsidiaryValue, // 使用實際存在的欄位名 subsidiary_id
        // 注意：ns_accounts 表中沒有 parent_id 和 is_summary 欄位
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

