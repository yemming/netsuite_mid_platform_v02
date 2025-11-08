import { NextResponse } from 'next/server';
import { executeSync } from '@/lib/sync-utils';

/**
 * 同步 Items（產品主檔）
 */
export async function POST() {
  const config = {
    tableName: 'ns_items',
    suiteqlQuery: `
      SELECT 
        id,
        itemid,
        displayname,
        fullname,
        itemtype,
        description,
        salesdescription,
        purchasedescription,
        baseprice,
        incomeaccount,
        expenseaccount,
        assetaccount,
        costingmethod,
        isinactive
      FROM item
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';

      return {
        netsuite_internal_id: parseInt(item.id),
        item_id: item.itemid || '',
        name: item.displayname || null,
        display_name: item.displayname || null,
        full_name: item.fullname || null,
        item_type: item.itemtype || null,
        description: item.description || null,
        sales_description: item.salesdescription || null,
        purchase_description: item.purchasedescription || null,
        base_price: item.baseprice ? parseFloat(item.baseprice) : null,
        income_account_id: item.incomeaccount ? parseInt(item.incomeaccount) : null,
        expense_account_id: item.expenseaccount ? parseInt(item.expenseaccount) : null,
        asset_account_id: item.assetaccount ? parseInt(item.assetaccount) : null,
        costing_method: item.costingmethod || null,
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
  const status = await getTableSyncStatus('ns_items');
  return NextResponse.json(status);
}

