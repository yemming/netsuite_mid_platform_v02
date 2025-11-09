import { NextResponse } from 'next/server';
import { executeSync } from '@/lib/sync-utils';

/**
 * 同步 Customers（客戶）
 */
export async function POST() {
  const config = {
    tableName: 'ns_entities_customers',
    suiteqlQuery: `
      SELECT 
        id,
        entityid,
        companyname,
        fullname,
        firstname,
        lastname,
        email,
        phone,
        currency,
        terms,
        isinactive
      FROM customer
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';
      const name = item.companyname || item.fullname || `${item.firstname || ''} ${item.lastname || ''}`.trim() || '';

      // 處理 subsidiary（如果有的話，取第一個值）
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
        // 注意：ns_entities_customers 表中沒有 alt_name, is_person, first_name, last_name 欄位
        email: item.email || null,
        phone: item.phone || null,
        subsidiary_id: subsidiaryValue, // 所屬公司 ID（取第一個值）
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
  const status = await getTableSyncStatus('ns_entities_customers');
  return NextResponse.json(status);
}

