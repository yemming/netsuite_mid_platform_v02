import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { User, UserRole, UserStatus } from '@/lib/field-operations-types';

/**
 * 取得所有人員列表
 * GET /api/field-operations/personnel
 * 
 * 查詢參數：
 * - role: 篩選角色 (dispatcher | technician | admin)
 * - status: 篩選狀態 (online | offline)
 * - search: 搜尋姓名或電子郵件
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

    // 取得查詢參數
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role') as UserRole | null;
    const status = searchParams.get('status') as UserStatus | null;
    const search = searchParams.get('search');

    // 使用 RPC 函數取得人員列表（包含 auth.users 的 name 和 email）
    const { data, error } = await supabase.rpc('get_personnel_with_user_info', {
      p_role: role || null,
      p_status: status || null,
      p_search: search || null,
    });

    if (error) {
      console.error('查詢人員資料錯誤:', error);
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
    console.error('取得人員列表錯誤:', error);
    return NextResponse.json(
      { error: '伺服器錯誤', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 新增人員
 * POST /api/field-operations/personnel
 * 
 * 請求體：
 * {
 *   personnel_id: string (必填，例如：USER-001)
 *   name: string (必填)
 *   email: string (必填，唯一)
 *   role: 'dispatcher' | 'technician' | 'admin' (必填)
 *   skills?: string[] (可選，僅技術人員)
 *   status?: 'online' | 'offline' (可選，預設 'offline')
 *   avatar?: string (可選)
 *   location?: { latitude: number, longitude: number, lastUpdated?: string, address?: string } (可選)
 * }
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { user_id, role, skills, status, avatar, location } = body;

    // 驗證必填欄位
    if (!user_id || !role) {
      return NextResponse.json(
        { error: '缺少必要欄位', required: ['user_id', 'role'] },
        { status: 400 }
      );
    }

    // 驗證 user_id 格式（UUID）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      return NextResponse.json(
        { error: '無效的 user_id 格式' },
        { status: 400 }
      );
    }

    // 驗證角色
    const validRoles: UserRole[] = ['dispatcher', 'technician', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: '無效的角色', validRoles },
        { status: 400 }
      );
    }

    // 驗證狀態
    if (status && !['online', 'offline'].includes(status)) {
      return NextResponse.json(
        { error: '無效的狀態', validStatuses: ['online', 'offline'] },
        { status: 400 }
      );
    }

    // 驗證 location 格式（如果有提供）
    if (location) {
      if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        return NextResponse.json(
          { error: '位置資訊格式錯誤，需要 latitude 和 longitude 數字' },
          { status: 400 }
        );
      }
    }

    // 直接使用 user_id 作為 personnel_id
    // 準備插入資料
    const insertData: any = {
      personnel_id: user_id, // 直接使用 user_id (UUID) 作為 personnel_id
      user_id,
      role,
      skills: skills || [],
      status: status || 'offline',
    };

    if (avatar) {
      insertData.avatar = avatar;
    }

    if (location) {
      insertData.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        lastUpdated: location.lastUpdated || new Date().toISOString(),
        ...(location.address && { address: location.address }),
      };
    }

    // 插入資料
    const { data, error } = await supabase
      .from('field_operations_personnel')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('新增人員錯誤:', error);
      console.error('錯誤詳情:', JSON.stringify(error, null, 2));
      
      // 處理唯一約束錯誤
      if (error.code === '23505') {
        if (error.message.includes('personnel_id') || error.message.includes('personnel_id')) {
          return NextResponse.json(
            { error: '此使用者已經存在於人員列表中', field: 'personnel_id', details: error.message },
            { status: 409 }
          );
        }
        if (error.message.includes('user_id')) {
          return NextResponse.json(
            { error: '此使用者已經存在於人員列表中', field: 'user_id', details: error.message },
            { status: 409 }
          );
        }
        if (error.message.includes('email')) {
          return NextResponse.json(
            { error: '電子郵件已存在', field: 'email', details: error.message },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        { error: '新增失敗', message: error.message, code: error.code, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '人員新增成功',
      data,
    }, { status: 201 });

  } catch (error: any) {
    console.error('新增人員錯誤:', error);
    return NextResponse.json(
      { error: '伺服器錯誤', message: error.message },
      { status: 500 }
    );
  }
}

