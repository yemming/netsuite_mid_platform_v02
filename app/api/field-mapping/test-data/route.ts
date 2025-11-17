import { NextResponse } from 'next/server';

/**
 * 測試資料 API
 * 用於開發時提供模擬的 NetSuite 和 Supabase 欄位資料
 */

// NetSuite 標準欄位（subsidiaries）
const NETSuite_FIELDS = [
  { name: 'id', type: 'integer', label: 'Internal ID', isCustom: false },
  { name: 'name', type: 'text', label: 'Name', isCustom: false },
  { name: 'legalname', type: 'text', label: 'Legal Name', isCustom: false },
  { name: 'country', type: 'text', label: 'Country', isCustom: false },
  { name: 'currency', type: 'integer', label: 'Currency', isCustom: false },
  { name: 'isinactive', type: 'boolean', label: 'Is Inactive', isCustom: false },
  { name: 'fullname', type: 'text', label: 'Full Name', isCustom: false },
  { name: 'parent', type: 'integer', label: 'Parent', isCustom: false },
  { name: 'iselimination', type: 'boolean', label: 'Is Elimination', isCustom: false },
  { name: 'state', type: 'text', label: 'State', isCustom: false },
  { name: 'email', type: 'text', label: 'Email', isCustom: false },
  { name: 'fiscalcalendar', type: 'integer', label: 'Fiscal Calendar', isCustom: false },
  { name: 'custbody_custom_field_1', type: 'text', label: 'Custom Field 1', isCustom: true },
  { name: 'custbody_custom_field_2', type: 'text', label: 'Custom Field 2', isCustom: true },
];

// Supabase 標準欄位（ns_subsidiaries）
const SUPABASE_COLUMNS = [
  { name: 'id', type: 'uuid', nullable: false },
  { name: 'netsuite_internal_id', type: 'integer', nullable: false },
  { name: 'name', type: 'text', nullable: false },
  { name: 'legal_name', type: 'text', nullable: true },
  { name: 'full_name', type: 'text', nullable: true },
  { name: 'country', type: 'text', nullable: true },
  { name: 'state', type: 'text', nullable: true },
  { name: 'email', type: 'text', nullable: true },
  { name: 'base_currency_id', type: 'integer', nullable: true },
  { name: 'parent_id', type: 'integer', nullable: true },
  { name: 'fiscal_calendar_id', type: 'integer', nullable: true },
  { name: 'is_elimination', type: 'boolean', nullable: false },
  { name: 'is_active', type: 'boolean', nullable: false },
  { name: 'sync_timestamp', type: 'timestamp', nullable: true },
  { name: 'created_at', type: 'timestamp', nullable: false },
  { name: 'updated_at', type: 'timestamp', nullable: false },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'netsuite' | 'supabase'

    if (type === 'netsuite') {
      return NextResponse.json({
        success: true,
        data: {
          mappingKey: 'subsidiaries',
          netsuiteTable: 'subsidiary',
          fields: NETSuite_FIELDS.map((field) => ({
            ...field,
            mappedTo: null,
            isMapped: false,
            isActive: false,
          })),
          total: NETSuite_FIELDS.length,
          mapped: 0,
          unmapped: NETSuite_FIELDS.length,
        },
      });
    }

    if (type === 'supabase') {
      return NextResponse.json({
        success: true,
        data: {
          tableName: 'ns_subsidiaries',
          columns: SUPABASE_COLUMNS,
          total: SUPABASE_COLUMNS.length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        netsuiteFields: NETSuite_FIELDS,
        supabaseColumns: SUPABASE_COLUMNS,
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

