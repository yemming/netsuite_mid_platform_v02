import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';
import { createClient } from '@/utils/supabase/server';

/**
 * 取得 NetSuite 表的所有欄位
 * GET /api/field-mapping/netsuite-fields?mappingKey=customers
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mappingKey = searchParams.get('mappingKey');

    if (!mappingKey) {
      return NextResponse.json(
        {
          success: false,
          error: '請提供 mappingKey',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const netsuite = getNetSuiteAPIClient();

    // 1. 取得表映射配置
    const { data: tableMapping, error: mappingError } = await supabase
      .from('table_mapping_config')
      .select('*')
      .eq('mapping_key', mappingKey)
      .single();

    if (mappingError || !tableMapping) {
      return NextResponse.json(
        {
          success: false,
          error: `找不到 mapping_key: ${mappingKey}`,
        },
        { status: 404 }
      );
    }

    // 2. 從 NetSuite 取得欄位資訊
    let netsuiteFields: Array<{
      name: string;
      type?: string;
      label?: string;
      isCustom: boolean;
    }> = [];

    // 標準欄位列表（fallback）
    const standardFieldsMap: Record<string, Array<{ name: string; type: string; label: string; isCustom?: boolean }>> = {
      'subsidiary': [
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
      ],
      'customer': [
        { name: 'id', type: 'integer', label: 'Internal ID', isCustom: false },
        { name: 'entityid', type: 'text', label: 'Entity ID', isCustom: false },
        { name: 'companyname', type: 'text', label: 'Company Name', isCustom: false },
        { name: 'email', type: 'text', label: 'Email', isCustom: false },
        { name: 'isinactive', type: 'boolean', label: 'Is Inactive', isCustom: false },
      ],
      'item': [
        { name: 'id', type: 'integer', label: 'Internal ID', isCustom: false },
        { name: 'itemid', type: 'text', label: 'Item ID', isCustom: false },
        { name: 'displayname', type: 'text', label: 'Display Name', isCustom: false },
        { name: 'type', type: 'text', label: 'Type', isCustom: false },
        { name: 'isinactive', type: 'boolean', label: 'Is Inactive', isCustom: false },
      ],
    };

    try {
      // 方法 A：使用 Metadata API
      const metadataUrl = `/services/rest/record/v1/metadata-catalog/${tableMapping.netsuite_table}`;
      const metadata = await netsuite.request(metadataUrl, 'GET');
      
      if (metadata.fields && Array.isArray(metadata.fields) && metadata.fields.length > 0) {
        netsuiteFields = metadata.fields.map((field: any) => ({
          name: field.name || field.id,
          type: field.type,
          label: field.label || field.name,
          isCustom: (field.name || field.id).startsWith('custbody_') || 
                   (field.name || field.id).startsWith('cseg_') ||
                   (field.name || field.id).startsWith('custcol_') ||
                   (field.name || field.id).startsWith('custrecord_'),
        }));
        console.log(`✅ Metadata API 成功取得 ${netsuiteFields.length} 個欄位`);
      } else {
        throw new Error('Metadata API 返回空欄位列表');
      }
    } catch (metadataError: any) {
      console.warn('⚠️ Metadata API 不可用，改用 SuiteQL 查詢:', metadataError.message);
      
      // 方法 B：使用 SuiteQL 查詢實際資料（LIMIT 1）
      try {
        const suiteqlQuery = `SELECT * FROM ${tableMapping.netsuite_table} WHERE ROWNUM <= 1`;
        const result = await netsuite.executeSuiteQL(suiteqlQuery, { fetchAll: false });
        
        if (result.items && result.items.length > 0) {
          // 從第一筆資料取得所有欄位名稱
          const firstItem = result.items[0];
          netsuiteFields = Object.keys(firstItem).map((key) => {
            const value = firstItem[key];
            let inferredType = 'text';
            
            if (value === null || value === undefined) {
              inferredType = 'unknown';
            } else if (typeof value === 'boolean') {
              inferredType = 'boolean';
            } else if (typeof value === 'number') {
              inferredType = Number.isInteger(value) ? 'integer' : 'number';
            } else if (typeof value === 'string') {
              if (value.match(/^\d{4}\/\d{2}\/\d{2}/) || value.match(/^\d{4}-\d{2}-\d{2}/)) {
                inferredType = 'date';
              } else {
                inferredType = 'text';
              }
            }

            return {
              name: key,
              type: inferredType,
              label: key,
              isCustom: key.startsWith('custbody_') || 
                       key.startsWith('cseg_') ||
                       key.startsWith('custcol_') ||
                       key.startsWith('custrecord_'),
            };
          });
          console.log(`✅ SuiteQL 成功取得 ${netsuiteFields.length} 個欄位`);
        } else {
          throw new Error('SuiteQL 查詢返回空結果');
        }
      } catch (suiteqlError: any) {
        console.warn('⚠️ SuiteQL 查詢失敗，使用標準欄位列表:', suiteqlError.message);
        
        // 方法 C：使用標準欄位列表（fallback）
        const tableKey = tableMapping.netsuite_table.toLowerCase();
        const standardFields = standardFieldsMap[tableKey] || [];
        netsuiteFields = standardFields.map((field) => ({
          name: field.name,
          type: field.type,
          label: field.label,
          isCustom: field.isCustom || false,
        }));
        console.log(`✅ 使用標準欄位列表，共 ${netsuiteFields.length} 個欄位`);
      }
    }

    // 如果還是沒有欄位，使用標準欄位列表作為最後的 fallback
    if (netsuiteFields.length === 0) {
      console.warn('⚠️ 所有方法都失敗，使用標準欄位列表作為最後 fallback');
      const tableKey = tableMapping.netsuite_table.toLowerCase();
      const standardFields = standardFieldsMap[tableKey] || [];
      netsuiteFields = standardFields.map((field) => ({
        name: field.name,
        type: field.type,
        label: field.label,
        isCustom: field.isCustom || false,
      }));
    }

    // 3. 取得已映射的欄位（用於標記）
    const { data: existingMappings } = await supabase
      .from('field_mapping_config')
      .select('netsuite_field_name, supabase_column_name, is_active')
      .eq('mapping_key', mappingKey);

    const mappedFields = new Map(
      (existingMappings || []).map((m: any) => [
        m.netsuite_field_name,
        { supabaseColumn: m.supabase_column_name, isActive: m.is_active },
      ])
    );

    // 4. 標記已映射的欄位
    const fieldsWithMapping = netsuiteFields.map((field) => ({
      ...field,
      mappedTo: mappedFields.get(field.name)?.supabaseColumn || null,
      isMapped: mappedFields.has(field.name),
      isActive: mappedFields.get(field.name)?.isActive || false,
    }));

    return NextResponse.json({
      success: true,
      data: {
        mappingKey,
        netsuiteTable: tableMapping.netsuite_table,
        fields: fieldsWithMapping,
        total: fieldsWithMapping.length,
        mapped: fieldsWithMapping.filter((f) => f.isMapped).length,
        unmapped: fieldsWithMapping.filter((f) => !f.isMapped).length,
      },
    });
  } catch (error: any) {
    console.error('取得 NetSuite 欄位錯誤:', error);
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

