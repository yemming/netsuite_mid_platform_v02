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

    // 建立查詢
    let query = supabase
      .from('field_operations_personnel')
      .select('*')
      .order('created_at', { ascending: false });

    // 套用篩選條件
    if (role) {
      query = query.eq('role', role);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;

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
    const { personnel_id, name, email, role, skills, status, avatar, location } = body;

    // 驗證必填欄位
    if (!personnel_id || !name || !email || !role) {
      return NextResponse.json(
        { error: '缺少必要欄位', required: ['personnel_id', 'name', 'email', 'role'] },
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

    // 驗證 email 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '無效的電子郵件格式' },
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

    // 準備插入資料
    const insertData: any = {
      personnel_id,
      name,
      email,
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
      
      // 處理唯一約束錯誤
      if (error.code === '23505') {
        if (error.message.includes('personnel_id')) {
          return NextResponse.json(
            { error: '人員識別碼已存在', field: 'personnel_id' },
            { status: 409 }
          );
        }
        if (error.message.includes('email')) {
          return NextResponse.json(
            { error: '電子郵件已存在', field: 'email' },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        { error: '新增失敗', message: error.message },
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

