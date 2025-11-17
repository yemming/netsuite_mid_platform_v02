import { NextResponse } from 'next/server';

/**
 * 快速測試資料 API
 * 用於快速展示 Field Mapping 的左右兩側數據
 * 
 * GET /api/quick-test-data?type=netsuite&table=subsidiary
 * GET /api/quick-test-data?type=supabase&table=ns_subsidiary
 */

// NetSuite Subsidiary 欄位（從 SuiteQL 查詢結果）
const NETSUITE_SUBSIDIARY_FIELDS = [
  { name: 'id', type: 'integer', label: 'Internal ID', isCustom: false },
  { name: 'name', type: 'text', label: 'Name', isCustom: false },
  { name: 'fullname', type: 'text', label: 'Full Name', isCustom: false },
  { name: 'country', type: 'text', label: 'Country', isCustom: false },
  { name: 'currency', type: 'text', label: 'Currency', isCustom: false },
  { name: 'edition', type: 'text', label: 'Edition', isCustom: false },
  { name: 'email', type: 'text', label: 'Email', isCustom: false },
  { name: 'fiscalcalendar', type: 'text', label: 'Fiscal Calendar', isCustom: false },
  { name: 'iselimination', type: 'text', label: 'Elimination', isCustom: false },
  { name: 'isinactive', type: 'text', label: 'Inactive', isCustom: false },
  { name: 'language', type: 'text', label: 'Language', isCustom: false },
  { name: 'legalname', type: 'text', label: 'Legal Name', isCustom: false },
  { name: 'logo', type: 'text', label: 'Logo', isCustom: false },
  { name: 'state', type: 'text', label: 'State', isCustom: false },
  { name: 'dropdownstate', type: 'text', label: 'State (Dropdown)', isCustom: false },
  { name: 'parent', type: 'integer', label: 'Parent', isCustom: false },
  { name: 'purchaseorderamount', type: 'numeric', label: 'PO Amount', isCustom: false },
  { name: 'purchaseorderquantity', type: 'numeric', label: 'PO Quantity', isCustom: false },
  { name: 'receiptamount', type: 'numeric', label: 'Receipt Amount', isCustom: false },
  { name: 'receiptquantity', type: 'numeric', label: 'Receipt Quantity', isCustom: false },
];

// Supabase ns_subsidiary 欄位
const SUPABASE_SUBSIDIARY_COLUMNS = [
  { name: 'id', type: 'bigint', nullable: false },
  { name: 'full_name', type: 'text', nullable: false },
  { name: 'name', type: 'text', nullable: true },
  { name: 'country', type: 'text', nullable: true },
  { name: 'currency', type: 'text', nullable: true },
  { name: 'edition', type: 'text', nullable: true },
  { name: 'email', type: 'text', nullable: true },
  { name: 'fiscal_calendar', type: 'text', nullable: true },
  { name: 'is_elimination', type: 'boolean', nullable: false },
  { name: 'is_inactive', type: 'boolean', nullable: false },
  { name: 'language', type: 'text', nullable: true },
  { name: 'legal_name', type: 'text', nullable: true },
  { name: 'logo', type: 'text', nullable: true },
  { name: 'state', type: 'text', nullable: true },
  { name: 'parent', type: 'bigint', nullable: true },
  { name: 'purchase_order_amount', type: 'numeric', nullable: true },
  { name: 'purchase_order_quantity', type: 'numeric', nullable: true },
  { name: 'receipt_amount', type: 'numeric', nullable: true },
  { name: 'receipt_quantity', type: 'numeric', nullable: true },
  { name: 'sync_timestamp', type: 'timestamptz', nullable: true },
  { name: 'created_at', type: 'timestamptz', nullable: false },
  { name: 'updated_at', type: 'timestamptz', nullable: false },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'netsuite' | 'supabase'
    const table = searchParams.get('table'); // 'subsidiary' | 'ns_subsidiary'

    if (type === 'netsuite') {
      return NextResponse.json({
        success: true,
        data: {
          table: table || 'subsidiary',
          fields: NETSUITE_SUBSIDIARY_FIELDS,
          total: NETSUITE_SUBSIDIARY_FIELDS.length,
        },
      });
    }

    if (type === 'supabase') {
      return NextResponse.json({
        success: true,
        data: {
          tableName: table || 'ns_subsidiary',
          columns: SUPABASE_SUBSIDIARY_COLUMNS,
          total: SUPABASE_SUBSIDIARY_COLUMNS.length,
        },
      });
    }

    // 返回兩邊的數據
    return NextResponse.json({
      success: true,
      data: {
        netsuite: {
          table: 'subsidiary',
          fields: NETSUITE_SUBSIDIARY_FIELDS,
          total: NETSUITE_SUBSIDIARY_FIELDS.length,
        },
        supabase: {
          tableName: 'ns_subsidiary',
          columns: SUPABASE_SUBSIDIARY_COLUMNS,
          total: SUPABASE_SUBSIDIARY_COLUMNS.length,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: '伺服器錯誤',
        message: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

