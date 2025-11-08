import { NextResponse } from 'next/server';
import { getTableSyncStatus } from '@/lib/sync-utils';

/**
 * 取得所有表的同步狀態
 */
export async function GET() {
  try {
    const tables = [
      { name: 'ns_subsidiaries', label: '公司別' },
      { name: 'ns_currencies', label: '幣別' },
      { name: 'ns_departments', label: '部門' },
      { name: 'ns_classes', label: '類別' },
      { name: 'ns_locations', label: '地點' },
      { name: 'ns_accounts', label: '會計科目' },
      { name: 'ns_items', label: '產品主檔' },
      { name: 'ns_entities_customers', label: '客戶' },
      { name: 'ns_entities_vendors', label: '供應商' },
      { name: 'ns_entities_employees', label: '員工' },
      { name: 'ns_tax_codes', label: '稅碼' },
      { name: 'ns_expense_categories', label: '費用類別' },
      { name: 'ns_terms', label: '付款條件' },
      { name: 'ns_accounting_periods', label: '會計期間' },
      { name: 'ns_ship_methods', label: '運送方式' },
    ];

    const statuses = await Promise.all(
      tables.map(async (table) => {
        const status = await getTableSyncStatus(table.name);
        return {
          tableName: table.name,
          label: table.label,
          ...status,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: statuses,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: '查詢失敗',
        message: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

