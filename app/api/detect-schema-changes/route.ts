import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';
import { createClient } from '@/utils/supabase/server';

/**
 * 取得標準欄位列表（當表中沒有資料時的備用方案）
 */
function getStandardFields(recordType: string): string[] {
  const standardFieldsMap: Record<string, string[]> = {
    'subsidiary': [
      'id', 'name', 'legalname', 'country', 'currency', 
      'isinactive', 'fullname', 'parent', 'iselimination',
      'state', 'email', 'fiscalcalendar'
    ],
    'currency': ['id', 'name', 'symbol', 'isinactive'],
    'item': ['id', 'itemid', 'displayname', 'type', 'isinactive'],
    'customer': ['id', 'entityid', 'companyname', 'email', 'isinactive'],
    'vendor': ['id', 'entityid', 'companyname', 'email', 'isinactive'],
    'employee': ['id', 'entityid', 'firstname', 'lastname', 'email', 'isinactive'],
    'department': ['id', 'name', 'subsidiary', 'isinactive'],
    'location': ['id', 'name', 'subsidiary', 'isinactive'],
    'classification': ['id', 'name', 'subsidiary', 'isinactive'],
    'account': ['id', 'accountnumber', 'displayname', 'accttype', 'isinactive'],
    'taxitem': ['id', 'itemid', 'displayname', 'isinactive'],
    'term': ['id', 'name', 'duedays', 'isinactive'],
  };

  return standardFieldsMap[recordType.toLowerCase()] || [];
}

/**
 * 偵測 NetSuite Schema 變更（新增欄位）
 * 
 * 流程：
 * 1. 從 NetSuite 取得 record type 的 metadata 或查詢實際資料
 * 2. 比對 field_mapping_config，找出新欄位
 * 3. 將新欄位寫入 field_mapping_config（is_active=false，等待確認）
 */
export async function POST(request: Request) {
  try {
    console.log('[detect-schema-changes] 開始處理請求');
    const body = await request.json();
    const { mappingKey, recordType: inputRecordType } = body;

    console.log('[detect-schema-changes] 請求參數:', { mappingKey, inputRecordType });

    if (!mappingKey && !inputRecordType) {
      return NextResponse.json(
        {
          success: false,
          error: '請提供 mappingKey 或 recordType',
        },
        { status: 400 }
      );
    }

    const netsuite = getNetSuiteAPIClient();
    const supabase = await createClient();
    console.log('[detect-schema-changes] 客戶端初始化完成');

    // 1. 取得表映射配置
    let tableMapping: {
      id?: string;
      mapping_key?: string;
      netsuite_table?: string;
      [key: string]: any;
    } | null = null;
    let recordType = inputRecordType;
    
    if (mappingKey) {
      const { data: mappingData, error: mappingError } = await supabase
        .from('table_mapping_config')
        .select('*')
        .eq('mapping_key', mappingKey)
        .single();

      if (mappingError || !mappingData) {
        return NextResponse.json(
          {
            success: false,
            error: `找不到 mapping_key: ${mappingKey}`,
          },
          { status: 404 }
        );
      }

      tableMapping = mappingData;
      recordType = recordType || tableMapping.netsuite_table;
      console.log('[detect-schema-changes] 取得表映射配置:', {
        mappingKey,
        recordType,
        netsuiteTable: tableMapping.netsuite_table,
      });
    }

    if (!recordType) {
      return NextResponse.json(
        {
          success: false,
          error: '無法確定 recordType',
          message: '請提供 recordType 或確保 mappingKey 對應的表映射配置存在',
        },
        { status: 400 }
      );
    }

    // 2. 從 NetSuite 取得欄位資訊
    // 注意：NetSuite Metadata API 可能返回 Swagger JSON（API 文檔），而不是實際欄位列表
    // 所以我們直接使用 SuiteQL 查詢實際資料來取得欄位（更可靠）
    let netsuiteFields: string[] = [];
    let netsuiteFieldMetadata: Record<string, { type?: string; label?: string }> = {};

    // 使用 SuiteQL 查詢實際資料（只取第一筆）
    try {
      // 嘗試多種語法來取得第一筆資料
      // NetSuite SuiteQL 可能支援 FETCH FIRST、ROWNUM 或 LIMIT
      let suiteqlQuery = `SELECT * FROM ${recordType} ORDER BY id FETCH FIRST 1 ROW ONLY`;
      console.log(`[detect-schema-changes] 嘗試 SuiteQL 查詢 (FETCH FIRST): ${suiteqlQuery}`);
      
      let result;
      try {
        result = await netsuite.executeSuiteQL(suiteqlQuery, { 
          fetchAll: false,
          maxRecords: 1 
        });
      } catch (fetchFirstError: any) {
        // 如果 FETCH FIRST 失敗，嘗試使用 ROWNUM
        console.warn(`[detect-schema-changes] FETCH FIRST 失敗，嘗試 ROWNUM:`, fetchFirstError.message);
        suiteqlQuery = `SELECT * FROM ${recordType} WHERE ROWNUM <= 1 ORDER BY id`;
        console.log(`[detect-schema-changes] 嘗試 SuiteQL 查詢 (ROWNUM): ${suiteqlQuery}`);
        
        try {
          result = await netsuite.executeSuiteQL(suiteqlQuery, { 
            fetchAll: false,
            maxRecords: 1 
          });
        } catch (rownumError: any) {
          // 如果 ROWNUM 也失敗，嘗試使用 LIMIT
          console.warn(`[detect-schema-changes] ROWNUM 失敗，嘗試 LIMIT:`, rownumError.message);
          suiteqlQuery = `SELECT * FROM ${recordType} ORDER BY id LIMIT 1`;
          console.log(`[detect-schema-changes] 嘗試 SuiteQL 查詢 (LIMIT): ${suiteqlQuery}`);
          
          result = await netsuite.executeSuiteQL(suiteqlQuery, { 
            fetchAll: false,
            maxRecords: 1 
          });
        }
      }
      
      if (!result) {
        throw new Error('SuiteQL 查詢返回空結果');
      }
      
      console.log(`[detect-schema-changes] SuiteQL 查詢結果:`, {
        hasItems: !!result.items,
        itemCount: result.items?.length || 0,
        firstItemKeys: result.items?.[0] ? Object.keys(result.items[0]) : [],
        query: suiteqlQuery,
      });
      
      if (result.items && result.items.length > 0) {
        const firstItem = result.items[0];
        
        // 從第一筆資料取得所有欄位名稱
        netsuiteFields = Object.keys(firstItem);
        
        // 推斷欄位型別（使用 Object.entries 而不是 forEach）
        Object.entries(firstItem).forEach(([key, value]) => {
          if (value === null || value === undefined) {
            netsuiteFieldMetadata[key] = { type: 'unknown' };
          } else if (typeof value === 'boolean') {
            netsuiteFieldMetadata[key] = { type: 'boolean' };
          } else if (typeof value === 'number') {
            netsuiteFieldMetadata[key] = { type: Number.isInteger(value) ? 'integer' : 'number' };
          } else if (typeof value === 'string') {
            // 檢查是否為日期字串
            if (value.match(/^\d{4}\/\d{2}\/\d{2}/) || value.match(/^\d{4}-\d{2}-\d{2}/)) {
              netsuiteFieldMetadata[key] = { type: 'date' };
            } else {
              netsuiteFieldMetadata[key] = { type: 'text' };
            }
          } else {
            netsuiteFieldMetadata[key] = { type: 'unknown' };
          }
        });
        
        console.log(`[detect-schema-changes] 從 SuiteQL 取得 ${netsuiteFields.length} 個欄位`);
      } else {
        // 如果表中沒有資料，嘗試使用已知的標準欄位
        console.warn(`[detect-schema-changes] SuiteQL 查詢返回空結果，嘗試使用標準欄位`);
        
        // 根據 recordType 使用已知的標準欄位
        const standardFields = getStandardFields(recordType);
        if (standardFields.length > 0) {
          netsuiteFields = standardFields;
          standardFields.forEach(field => {
            netsuiteFieldMetadata[field] = { type: 'text' }; // 預設為 text
          });
          console.log(`[detect-schema-changes] 使用標準欄位: ${standardFields.length} 個`);
        } else {
          console.warn(`[detect-schema-changes] 無法取得標準欄位，recordType: ${recordType}`);
        }
      }
    } catch (suiteqlError: any) {
      console.error(`[detect-schema-changes] SuiteQL 查詢失敗:`, {
        recordType,
        error: suiteqlError.message,
        stack: suiteqlError.stack,
      });
      
      // 如果 SuiteQL 查詢失敗，嘗試使用標準欄位作為最後的 fallback
      console.warn(`[detect-schema-changes] SuiteQL 查詢失敗，使用標準欄位作為 fallback`);
      const standardFields = getStandardFields(recordType);
      if (standardFields.length > 0) {
        netsuiteFields = standardFields;
        standardFields.forEach(field => {
          netsuiteFieldMetadata[field] = { type: 'text' }; // 預設為 text
        });
        console.log(`[detect-schema-changes] 使用標準欄位作為 fallback: ${standardFields.length} 個`);
      } else {
        // 如果連標準欄位都沒有，返回錯誤
        return NextResponse.json(
          {
            success: false,
            error: '無法從 NetSuite 取得欄位資訊',
            message: `SuiteQL 查詢失敗且無標準欄位可用: ${suiteqlError.message || '未知錯誤'}`,
            details: {
              recordType,
              suiteqlError: suiteqlError.message || suiteqlError.toString(),
            },
          },
          { status: 500 }
        );
      }
    }

    if (netsuiteFields.length === 0) {
      console.error(`[detect-schema-changes] 無法取得任何欄位`, {
        mappingKey,
        recordType,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: '無法從 NetSuite 取得任何欄位',
          message: `無法從 NetSuite 取得 ${recordType} 表的欄位資訊。請確認：1) 表名是否正確 2) 是否有查詢權限 3) 表中是否有資料`,
          details: {
            mappingKey,
            recordType,
          },
        },
        { status: 500 }
      );
    }
    
    console.log(`[detect-schema-changes] 成功取得 ${netsuiteFields.length} 個欄位`);

    // 3. 從 field_mapping_config 取得已映射的欄位
    const { data: existingMappings, error: mappingError } = await supabase
      .from('field_mapping_config')
      .select('netsuite_field_name')
      .eq('mapping_key', mappingKey || tableMapping?.mapping_key);

    if (mappingError) {
      return NextResponse.json(
        {
          success: false,
          error: '查詢已映射欄位失敗',
          details: mappingError,
        },
        { status: 500 }
      );
    }

    const existingFieldNames = new Set(
      (existingMappings || []).map((m: any) => m.netsuite_field_name)
    );

    // 4. 找出新欄位
    const newFields = netsuiteFields.filter((field) => !existingFieldNames.has(field));

    if (newFields.length === 0) {
      return NextResponse.json({
        success: true,
        message: '沒有發現新欄位',
        data: {
          totalFields: netsuiteFields.length,
          existingFields: existingFieldNames.size,
          newFields: [],
        },
      });
    }

    // 5. 為新欄位生成建議的 Supabase 欄位名稱和型別
    const newFieldMappings = newFields.map((field) => {
      const metadata = netsuiteFieldMetadata[field] || {};
      const isCustomField = field.startsWith('custbody_') || 
                           field.startsWith('cseg_') || 
                           field.startsWith('custcol_') ||
                           field.startsWith('custrecord_');

      // 生成 Supabase 欄位名稱
      let supabaseColumnName = field;
      if (isCustomField) {
        // 客制欄位：custbody_xxx -> custom_xxx
        supabaseColumnName = field.replace(/^cust(body|seg|col|record)_/, 'custom_');
      } else {
        // 標準欄位：保持原樣或使用常見映射
        const commonMappings: Record<string, string> = {
          'isinactive': 'is_active',
          'id': 'netsuite_internal_id',
        };
        supabaseColumnName = commonMappings[field] || field.toLowerCase();
      }

      // 推斷 Supabase 型別
      let supabaseColumnType = 'text';
      const netsuiteType = metadata.type || 'text';
      
      if (netsuiteType === 'boolean' || field.includes('is') || field.includes('has')) {
        supabaseColumnType = 'boolean';
      } else if (netsuiteType === 'integer' || netsuiteType === 'number') {
        supabaseColumnType = 'integer';
      } else if (netsuiteType === 'date') {
        supabaseColumnType = 'timestamp';
      } else if (field.includes('amount') || field.includes('price') || field.includes('cost')) {
        supabaseColumnType = 'numeric';
      }

      // 生成轉換規則
      let transformationRule: any = {};
      if (supabaseColumnType === 'boolean' && netsuiteType !== 'boolean') {
        // NetSuite 常用 'T'/'F' 表示 boolean
        transformationRule = {
          type: 'boolean',
          true_value: 'T',
          false_value: 'F',
        };
      }

      return {
        mapping_key: mappingKey || tableMapping?.mapping_key,
        table_mapping_id: tableMapping?.id || null,
        netsuite_field_name: field,
        netsuite_field_type: netsuiteType,
        netsuite_field_label: metadata.label || field,
        supabase_column_name: supabaseColumnName,
        supabase_column_type: supabaseColumnType,
        transformation_rule: transformationRule,
        is_active: false, // 預設為待確認
        is_custom_field: isCustomField,
        detected_at: new Date().toISOString(),
        detected_by: 'schema_scanner',
      };
    });

    // 6. 寫入 field_mapping_config（使用 INSERT ... ON CONFLICT 避免重複）
    const insertResults = [];
    const errors = [];

    for (const mapping of newFieldMappings) {
      try {
        const { data, error } = await supabase
          .from('field_mapping_config')
          .insert(mapping)
          .select()
          .single();

        if (error) {
          // 如果是唯一約束衝突，表示已經存在，跳過
          if (error.code === '23505') {
            insertResults.push({
              field: mapping.netsuite_field_name,
              status: 'already_exists',
            });
          } else {
            errors.push({
              field: mapping.netsuite_field_name,
              error: error.message,
            });
          }
        } else {
          insertResults.push({
            field: mapping.netsuite_field_name,
            status: 'created',
            id: data.id,
          });
        }
      } catch (err: any) {
        errors.push({
          field: mapping.netsuite_field_name,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `發現 ${newFields.length} 個新欄位`,
      data: {
        totalFields: netsuiteFields.length,
        existingFields: existingFieldNames.size,
        newFields: newFields.length,
        inserted: insertResults.filter((r) => r.status === 'created').length,
        alreadyExists: insertResults.filter((r) => r.status === 'already_exists').length,
        errors: errors.length,
        details: {
          insertResults,
          errors: errors.length > 0 ? errors : undefined,
          newFieldMappings: newFieldMappings.map((m) => ({
            netsuite_field_name: m.netsuite_field_name,
            supabase_column_name: m.supabase_column_name,
            supabase_column_type: m.supabase_column_type,
            is_custom_field: m.is_custom_field,
          })),
        },
      },
    });
  } catch (error: any) {
    console.error('[detect-schema-changes] 伺服器錯誤:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      {
        success: false,
        error: '伺服器錯誤',
        message: error.message || '未知錯誤',
        details: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          name: error.name,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET：查詢待確認的新欄位
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mappingKey = searchParams.get('mappingKey');
    const includeActive = searchParams.get('includeActive') === 'true';

    const supabase = await createClient();

    let query = supabase
      .from('field_mapping_config')
      .select(`
        *,
        table_mapping:table_mapping_config(
          mapping_key,
          label,
          supabase_table_name
        )
      `)
      .order('detected_at', { ascending: false });

    if (mappingKey) {
      query = query.eq('mapping_key', mappingKey);
    }

    if (!includeActive) {
      query = query.eq('is_active', false);
    }

    const { data, error } = await query;

    if (error) {
      // 如果表不存在（錯誤碼 42P01），返回空陣列而不是錯誤
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          data: {
            total: 0,
            fields: [],
            message: 'field_mapping_config 表尚未建立，請先執行 create_field_mapping_config.sql',
          },
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: '查詢失敗',
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        total: data?.length || 0,
        fields: data || [],
      },
    });
  } catch (error: any) {
    console.error('查詢待確認欄位錯誤:', error);
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

