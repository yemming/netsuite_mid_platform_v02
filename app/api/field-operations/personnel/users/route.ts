import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 取得 auth.users 列表（供前端選擇使用者）
 * GET /api/field-operations/personnel/users
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 取得當前使用者資訊
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: '無法取得使用者資訊，請重新登入' },
        { status: 401 }
      );
    }

    // 使用 RPC 函數取得使用者列表
    const { data, error } = await supabase.rpc('get_auth_users_list');

    if (error) {
      console.error('查詢使用者列表錯誤:', error);
      return NextResponse.json(
        { error: '查詢失敗', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });

  } catch (error: any) {
    console.error('取得使用者列表錯誤:', error);
    return NextResponse.json(
      { error: '伺服器錯誤', message: error.message },
      { status: 500 }
    );
  }
}

