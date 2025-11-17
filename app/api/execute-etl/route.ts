import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 執行 ETL API
 * 
 * 根據映射配置執行資料轉換和匯入
 */

interface TransformRule {
  type: 'direct' | 'default' | 'vlookup' | 'aggregate' | 'expression';
  config?: any;
}

interface MappingRule {
  sourceField: string;
  targetField: string;
  sourceType?: string;
  targetType: string;
  transform: TransformRule;
}

interface ETLRequest {
  targetTable: string;
  mappings: MappingRule[];
  csvData: Record<string, any>[];
  primaryKey?: string;
  mode: 'create' | 'upsert';
}

export async function POST(request: NextRequest) {
  try {
    const body: ETLRequest = await request.json();
    const { targetTable, mappings, csvData, primaryKey, mode } = body;

    if (!targetTable || !mappings || !csvData || csvData.length === 0) {
      return NextResponse.json(
        { success: false, error: '請提供完整的 ETL 參數' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const syncTimestamp = new Date().toISOString();

    // 轉換資料
    const transformedData = csvData.map((row) => {
      const transformed: Record<string, any> = {
        sync_timestamp: syncTimestamp,
      };

      mappings.forEach((mapping) => {
        const sourceValue = row[mapping.sourceField];
        const transformedValue = transformValue(
          sourceValue,
          mapping.transform,
          mapping.targetType
        );
        transformed[mapping.targetField] = transformedValue;
      });

      return transformed;
    });

    // 執行匯入
    let result;
    if (mode === 'upsert' && primaryKey) {
      // UPSERT 模式
      result = await supabase
        .from(targetTable)
        .upsert(transformedData, {
          onConflict: primaryKey,
          ignoreDuplicates: false,
        });
    } else {
      // INSERT 模式
      result = await supabase.from(targetTable).insert(transformedData);
    }

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          error: '資料匯入失敗',
          details: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `成功匯入 ${transformedData.length} 筆資料`,
      data: {
        imported: transformedData.length,
        targetTable,
        syncTimestamp,
      },
    });
  } catch (error: any) {
    console.error('ETL 執行錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '執行 ETL 失敗',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * 轉換單一欄位值
 */
function transformValue(
  value: any,
  transform: TransformRule,
  targetType: string
): any {
  // 處理 null/undefined
  if (value === null || value === undefined || value === '') {
    // 如果有預設值
    if (transform.type === 'default' && transform.config?.defaultValue !== undefined) {
      return transform.config.defaultValue;
    }
    return null;
  }

  // 根據轉換類型處理
  switch (transform.type) {
    case 'direct':
      return castToType(value, targetType);

    case 'default':
      return value || transform.config?.defaultValue || null;

    case 'expression':
      // SQL Expression（簡化版，實際應該用安全的方式執行）
      if (transform.config?.expression) {
        try {
          // 這裡可以實作更複雜的表達式邏輯
          return eval(transform.config.expression.replace('${value}', JSON.stringify(value)));
        } catch {
          return value;
        }
      }
      return value;

    case 'vlookup':
      // VLOOKUP 邏輯（需要額外的查詢，這裡先回傳原值）
      // TODO: 實作 VLOOKUP
      return value;

    case 'aggregate':
      // Aggregate 邏輯（需要多筆資料，這裡先回傳原值）
      // TODO: 實作 Aggregate
      return value;

    default:
      return castToType(value, targetType);
  }
}

/**
 * 型別轉換
 */
function castToType(value: any, targetType: string): any {
  switch (targetType.toLowerCase()) {
    case 'integer':
    case 'int':
    case 'bigint':
      const intValue = parseInt(String(value), 10);
      return isNaN(intValue) ? null : intValue;

    case 'numeric':
    case 'decimal':
    case 'number':
      const numValue = parseFloat(String(value));
      return isNaN(numValue) ? null : numValue;

    case 'boolean':
    case 'bool':
      if (typeof value === 'boolean') return value;
      const strValue = String(value).toLowerCase();
      return ['true', 't', '1', 'yes', 'y'].includes(strValue);

    case 'date':
    case 'timestamp':
    case 'timestamptz':
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString();

    case 'json':
    case 'jsonb':
      if (typeof value === 'object') return value;
      try {
        return JSON.parse(String(value));
      } catch {
        return value;
      }

    case 'text':
    case 'varchar':
    case 'string':
    default:
      return String(value);
  }
}

