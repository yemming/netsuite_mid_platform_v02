import { NextResponse } from 'next/server';
import { executeSync } from '@/lib/sync-utils';

/**
 * 同步 Departments（部門）
 */
export async function POST() {
  const config = {
    tableName: 'ns_departments',
    suiteqlQuery: `
      SELECT 
        id,
        name,
        subsidiary,
        parent,
        fullname,
        isinactive
      FROM department
      ORDER BY id
    `,
    transformFunction: (item: any, syncTimestamp: string) => {
      const isActive = item.isinactive !== 'T';
      
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
        name: item.name || '',
        subsidiary_id: subsidiaryValue, // 使用實際存在的欄位名 subsidiary_id
        parent_id: item.parent ? parseInt(item.parent) : null,
        full_name: item.fullname || null,
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
  const status = await getTableSyncStatus('ns_departments');
  return NextResponse.json(status);
}

