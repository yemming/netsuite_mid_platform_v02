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
      const name = item.companyname || item.fullname || '';

      // 處理 subsidiary（如果有的話，取第一個值）
      // 注意：NetSuite SuiteQL 的 vendor 表可能沒有 subsidiary 欄位
      let subsidiaryValue = null;
      if (item.subsidiary) {
        const subsidiaryStr = String(item.subsidiary).trim();
        if (subsidiaryStr.includes(',')) {
          const firstId = subsidiaryStr.split(',')[0].trim();
          subsidiaryValue = firstId ? parseInt(firstId) : null;
        } else {
          subsidiaryValue = parseInt(subsidiaryStr);
        }
      }

      return {
        netsuite_internal_id: parseInt(item.id),
        entity_id: item.entityid || null,
        name: name,
        company_name: item.companyname || null,
        // 注意：ns_entities_vendors 表中沒有 alt_name, is_person 欄位
        email: item.email || null,
        phone: item.phone || null,
        subsidiary_id: subsidiaryValue, // 所屬公司 ID（可能為 null）
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

