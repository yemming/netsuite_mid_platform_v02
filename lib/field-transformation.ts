/**
 * 動態欄位轉換工具
 * 
 * 從 field_mapping_config 讀取映射規則，動態生成轉換函數
 * 用於 n8n 工作流或 Next.js API 中的資料轉換
 */

import { createClient } from '@/utils/supabase/server';

export interface FieldMapping {
  id: string;
  mapping_key: string;
  netsuite_field_name: string;
  netsuite_field_type?: string;
  supabase_column_name: string;
  supabase_column_type: string;
  transformation_rule: any;
  is_active: boolean;
  is_custom_field: boolean;
}

/**
 * 取得指定表的欄位映射配置
 */
export async function getFieldMappings(mappingKey: string): Promise<FieldMapping[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('field_mapping_config')
    .select('*')
    .eq('mapping_key', mappingKey)
    .eq('is_active', true)
    .order('netsuite_field_name', { ascending: true });

  if (error) {
    console.error('查詢欄位映射失敗:', error);
    return [];
  }

  return (data || []) as FieldMapping[];
}

/**
 * 根據欄位映射配置轉換單筆記錄
 */
export function transformRecord(
  netsuiteRecord: any,
  fieldMappings: FieldMapping[],
  syncTimestamp: string
): Record<string, any> {
  const result: Record<string, any> = {
    sync_timestamp: syncTimestamp,
    updated_at: syncTimestamp,
  };

  fieldMappings.forEach((mapping) => {
    const netsuiteValue = netsuiteRecord[mapping.netsuite_field_name];
    const transformedValue = transformValue(
      netsuiteValue,
      mapping.transformation_rule,
      mapping.supabase_column_type
    );

    // 只加入非 undefined 的值
    if (transformedValue !== undefined) {
      result[mapping.supabase_column_name] = transformedValue;
    }
  });

  return result;
}

/**
 * 轉換單一欄位值
 */
export function transformValue(
  value: any,
  transformationRule: any,
  targetType: string
): any {
  // 處理 null/undefined
  if (value === null || value === undefined) {
    return null;
  }

  // 如果有自訂轉換規則，優先使用
  if (transformationRule && transformationRule.type) {
    switch (transformationRule.type) {
      case 'boolean':
        // NetSuite 常用 'T'/'F' 表示 boolean
        if (transformationRule.true_value !== undefined) {
          return value === transformationRule.true_value || value === 'T';
        }
        return Boolean(value);

      case 'integer':
        return parseInt(String(value), 10) || null;

      case 'number':
      case 'numeric':
        return parseFloat(String(value)) || null;

      case 'date':
      case 'timestamp':
        // 處理 NetSuite 日期格式（YYYY/MM/DD 或 ISO 8601）
        if (typeof value === 'string') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toISOString();
        }
        return value;

      case 'string':
        return String(value);

      default:
        break;
    }
  }

  // 根據目標型別進行轉換
  switch (targetType.toLowerCase()) {
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value === 'T' || value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);

    case 'integer':
    case 'bigint':
      return parseInt(String(value), 10) || null;

    case 'numeric':
    case 'decimal':
      return parseFloat(String(value)) || null;

    case 'timestamp':
    case 'timestamptz':
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.toISOString();
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;

    case 'date':
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
      }
      return value;

    case 'text':
    case 'varchar':
    default:
      return String(value);
  }
}

/**
 * 批次轉換多筆記錄
 */
export function transformRecords(
  netsuiteRecords: any[],
  fieldMappings: FieldMapping[],
  syncTimestamp: string
): Record<string, any>[] {
  return netsuiteRecords.map((record) =>
    transformRecord(record, fieldMappings, syncTimestamp)
  );
}

/**
 * 生成轉換函數（用於 n8n Code Node）
 * 
 * 返回一個 JavaScript 函數字串，可以在 n8n 的 Code Node 中使用
 */
export function generateTransformationFunction(mappingKey: string): string {
  return `
// 動態生成的轉換函數（mappingKey: ${mappingKey}）
// 使用方式：在 n8n Code Node 中，將此函數貼上並執行

async function transformRecord(netsuiteRecord, fieldMappings, syncTimestamp) {
  const result = {
    sync_timestamp: syncTimestamp,
    updated_at: syncTimestamp,
  };

  fieldMappings.forEach((mapping) => {
    const netsuiteValue = netsuiteRecord[mapping.netsuite_field_name];
    let transformedValue = netsuiteValue;

    // 處理 null/undefined
    if (transformedValue === null || transformedValue === undefined) {
      transformedValue = null;
    } else {
      // 根據轉換規則處理
      const rule = mapping.transformation_rule || {};
      
      if (rule.type === 'boolean') {
        transformedValue = transformedValue === rule.true_value || transformedValue === 'T';
      } else if (rule.type === 'integer') {
        transformedValue = parseInt(String(transformedValue), 10) || null;
      } else if (rule.type === 'number' || rule.type === 'numeric') {
        transformedValue = parseFloat(String(transformedValue)) || null;
      } else if (rule.type === 'date' || rule.type === 'timestamp') {
        const date = new Date(transformedValue);
        transformedValue = isNaN(date.getTime()) ? null : date.toISOString();
      } else if (mapping.supabase_column_type === 'boolean') {
        transformedValue = transformedValue === 'T' || transformedValue === true || transformedValue === '1';
      } else if (mapping.supabase_column_type === 'integer' || mapping.supabase_column_type === 'bigint') {
        transformedValue = parseInt(String(transformedValue), 10) || null;
      } else if (mapping.supabase_column_type === 'numeric') {
        transformedValue = parseFloat(String(transformedValue)) || null;
      } else {
        transformedValue = String(transformedValue);
      }
    }

    if (transformedValue !== undefined) {
      result[mapping.supabase_column_name] = transformedValue;
    }
  });

  return result;
}

// 使用範例：
// const fieldMappings = await $http.get('/api/field-mapping?mappingKey=${mappingKey}');
// const transformed = transformRecord($input.item.json, fieldMappings.data.fields, new Date().toISOString());
// return transformed;
`;
}

/**
 * 驗證轉換後的記錄
 */
export function validateTransformedRecord(
  record: Record<string, any>,
  fieldMappings: FieldMapping[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 檢查必填欄位
  fieldMappings.forEach((mapping: any) => {
    if ((mapping as any).is_required && (record[mapping.supabase_column_name] === null || record[mapping.supabase_column_name] === undefined)) {
      errors.push(`必填欄位 ${mapping.supabase_column_name} 為空`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

