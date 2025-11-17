import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 欄位映射管理 API
 * 
 * GET: 查詢欄位映射
 * POST: 建立或更新欄位映射
 * PUT: 更新欄位映射（啟用/停用、修改配置）
 * DELETE: 刪除欄位映射
 */

/**
 * GET：查詢欄位映射
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mappingKey = searchParams.get('mappingKey');
    const fieldId = searchParams.get('id');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const supabase = await createClient();

    let query = supabase
      .from('field_mapping_config')
      .select(`
        *,
        table_mapping:table_mapping_config(
          mapping_key,
          label,
          supabase_table_name,
          netsuite_table
        )
      `)
      .order('netsuite_field_name', { ascending: true });

    if (fieldId) {
      query = query.eq('id', fieldId).single();
    } else if (mappingKey) {
      query = query.eq('mapping_key', mappingKey);
    }

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
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
      data: fieldId ? data : { fields: data || [], total: data?.length || 0 },
    });
  } catch (error: any) {
    console.error('查詢欄位映射錯誤:', error);
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

/**
 * POST：建立欄位映射
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      mappingKey,
      netsuiteFieldName,
      supabaseColumnName,
      supabaseColumnType,
      transformationRule,
      isCustomField,
    } = body;

    if (!mappingKey || !netsuiteFieldName || !supabaseColumnName) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要欄位：mappingKey, netsuiteFieldName, supabaseColumnName',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 取得 table_mapping_id
    const { data: tableMapping, error: mappingError } = await supabase
      .from('table_mapping_config')
      .select('id')
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

    const { data, error } = await supabase
      .from('field_mapping_config')
      .insert({
        mapping_key: mappingKey,
        table_mapping_id: tableMapping.id,
        netsuite_field_name: netsuiteFieldName,
        supabase_column_name: supabaseColumnName,
        supabase_column_type: supabaseColumnType || 'text',
        transformation_rule: transformationRule || {},
        is_custom_field: isCustomField || false,
        is_active: true,
        detected_at: new Date().toISOString(),
        detected_by: 'manual',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: '欄位映射已存在',
            details: error,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: '建立欄位映射失敗',
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '欄位映射建立成功',
      data,
    });
  } catch (error: any) {
    console.error('建立欄位映射錯誤:', error);
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

/**
 * PUT：更新欄位映射
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '請提供欄位映射 ID',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 只允許更新特定欄位
    const allowedUpdates: Record<string, any> = {};
    const allowedFields = [
      'supabase_column_name',
      'supabase_column_type',
      'transformation_rule',
      'is_active',
      'is_required',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        allowedUpdates[field] = updates[field];
      }
    });

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '沒有可更新的欄位',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('field_mapping_config')
      .update(allowedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: '更新欄位映射失敗',
          details: error,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: '找不到指定的欄位映射',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '欄位映射更新成功',
      data,
    });
  } catch (error: any) {
    console.error('更新欄位映射錯誤:', error);
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

/**
 * DELETE：刪除欄位映射
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '請提供欄位映射 ID',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('field_mapping_config')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: '刪除欄位映射失敗',
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '欄位映射刪除成功',
    });
  } catch (error: any) {
    console.error('刪除欄位映射錯誤:', error);
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

