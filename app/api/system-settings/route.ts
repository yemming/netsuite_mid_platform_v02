import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 系統設定 API
 * GET: 取得所有設定或特定設定
 * PUT: 更新設定值
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // 取得特定設定
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', key)
        .single();

      if (error) {
        console.error('取得設定錯誤:', error);
        return NextResponse.json(
          { error: '取得設定失敗', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    } else {
      // 取得所有設定
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) {
        console.error('取得設定列表錯誤:', error);
        return NextResponse.json(
          { error: '取得設定列表失敗', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    console.error('系統設定 API 錯誤:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '系統設定 API 錯誤',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { key, value, description } = body;

    if (!key) {
      return NextResponse.json(
        { error: '請提供設定鍵（key）' },
        { status: 400 }
      );
    }

    // 更新設定
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        setting_key: key,
        setting_value: value || null,
        description: description || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_key',
      })
      .select()
      .single();

    if (error) {
      console.error('更新設定錯誤:', error);
      return NextResponse.json(
        { error: '更新設定失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: '設定已更新',
      data 
    });
  } catch (error) {
    console.error('更新設定 API 錯誤:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '更新設定 API 錯誤',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}

