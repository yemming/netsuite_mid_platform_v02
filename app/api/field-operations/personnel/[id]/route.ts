import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UserRole, UserStatus } from '@/lib/field-operations-types';

/**
 * 取得單一人員資料
 * GET /api/field-operations/personnel/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personnelId = params.id;
    const supabase = await createClient();

    // 取得當前使用者資訊
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: '無法取得使用者資訊，請重新登入' },
        { status: 401 }
      );
    }

    if (!personnelId) {
      return NextResponse.json(
        { error: '請提供人員 ID' },
        { status: 400 }
      );
    }

    // 使用 RPC 函數查詢人員資料（包含 auth.users 的 name 和 email）
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_personnel_by_id', {
      p_id: personnelId,
    });

    const data = rpcData && rpcData.length > 0 ? rpcData[0] : null;
    const error = rpcError;

    if (error) {
      console.error('查詢人員資料錯誤:', error);
      return NextResponse.json(
        { error: '查詢失敗', message: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: '找不到此人員' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error('取得人員資料錯誤:', error);
    return NextResponse.json(
      { error: '伺服器錯誤', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 更新人員資料
 * PUT /api/field-operations/personnel/[id]
 * 
 * 請求體（所有欄位都是可選的，只更新提供的欄位）：
 * {
 *   name?: string
 *   email?: string
 *   role?: 'dispatcher' | 'technician' | 'admin'
 *   skills?: string[]
 *   status?: 'online' | 'offline'
 *   avatar?: string
 *   location?: { latitude: number, longitude: number, lastUpdated?: string, address?: string }
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personnelId = params.id;
    const supabase = await createClient();

    // 取得當前使用者資訊
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: '無法取得使用者資訊，請重新登入' },
        { status: 401 }
      );
    }

    if (!personnelId) {
      return NextResponse.json(
        { error: '請提供人員 ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { user_id, role, skills, status, avatar, location } = body;

    // 驗證角色（如果有提供）
    if (role) {
      const validRoles: UserRole[] = ['dispatcher', 'technician', 'admin'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: '無效的角色', validRoles },
          { status: 400 }
        );
      }
    }

    // 驗證狀態（如果有提供）
    if (status && !['online', 'offline'].includes(status)) {
      return NextResponse.json(
        { error: '無效的狀態', validStatuses: ['online', 'offline'] },
        { status: 400 }
      );
    }

    // 驗證 user_id 格式（如果有提供）
    if (user_id !== undefined) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user_id)) {
        return NextResponse.json(
          { error: '無效的 user_id 格式' },
          { status: 400 }
        );
      }
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

    // 準備更新資料
    const updateData: any = {};

    if (user_id !== undefined) updateData.user_id = user_id;
    if (role !== undefined) updateData.role = role;
    if (skills !== undefined) updateData.skills = skills;
    if (status !== undefined) updateData.status = status;
    if (avatar !== undefined) updateData.avatar = avatar;

    if (location !== undefined) {
      updateData.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        lastUpdated: location.lastUpdated || new Date().toISOString(),
        ...(location.address && { address: location.address }),
      };
    }

    // 如果沒有要更新的欄位
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '請提供至少一個要更新的欄位' },
        { status: 400 }
      );
    }

    // 先查詢找到正確的記錄（使用 id 或 personnel_id）
    // 先嘗試用 personnel_id 查詢（因為前端傳的是 personnel_id）
    let { data: existingData, error: findError } = await supabase
      .from('field_operations_personnel')
      .select('id')
      .eq('personnel_id', personnelId)
      .maybeSingle();

    // 如果找不到，再嘗試用 id 查詢（可能是 UUID）
    if (!existingData && !findError) {
      const { data: dataById, error: errorById } = await supabase
        .from('field_operations_personnel')
        .select('id')
        .eq('id', personnelId)
        .maybeSingle();
      
      existingData = dataById;
      findError = errorById;
    }

    if (findError) {
      console.error('查詢人員記錄錯誤:', findError);
      return NextResponse.json(
        { error: '查詢失敗', message: findError.message },
        { status: 500 }
      );
    }

    if (!existingData) {
      return NextResponse.json(
        { error: '找不到此人員' },
        { status: 404 }
      );
    }

    // 使用找到的記錄 ID 更新
    const { data, error } = await supabase
      .from('field_operations_personnel')
      .update(updateData)
      .eq('id', existingData.id)
      .select()
      .single();

    if (error) {
      console.error('更新人員資料錯誤:', error);
      
      // 處理唯一約束錯誤
      if (error.code === '23505') {
        if (error.message.includes('email')) {
          return NextResponse.json(
            { error: '電子郵件已存在', field: 'email' },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        { error: '更新失敗', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '人員資料更新成功',
      data,
    });

  } catch (error: any) {
    console.error('更新人員資料錯誤:', error);
    return NextResponse.json(
      { error: '伺服器錯誤', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 刪除人員
 * DELETE /api/field-operations/personnel/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personnelId = params.id;
    const supabase = await createClient();

    // 取得當前使用者資訊
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: '無法取得使用者資訊，請重新登入' },
        { status: 401 }
      );
    }

    if (!personnelId) {
      return NextResponse.json(
        { error: '請提供人員 ID' },
        { status: 400 }
      );
    }

    // 先檢查人員是否存在（使用 id 或 personnel_id）
    // 先嘗試用 personnel_id 查詢
    let { data: existingData, error: checkError } = await supabase
      .from('field_operations_personnel')
      .select('id, personnel_id, name')
      .eq('personnel_id', personnelId)
      .maybeSingle();

    // 如果找不到，再嘗試用 id 查詢（可能是 UUID）
    if (!existingData && !checkError) {
      const { data: dataById, error: errorById } = await supabase
        .from('field_operations_personnel')
        .select('id, personnel_id, name')
        .eq('id', personnelId)
        .maybeSingle();
      
      existingData = dataById;
      checkError = errorById;
    }

    if (checkError) {
      console.error('查詢人員記錄錯誤:', checkError);
      return NextResponse.json(
        { error: '查詢失敗', message: checkError.message },
        { status: 500 }
      );
    }

    if (!existingData) {
      return NextResponse.json(
        { error: '找不到此人員' },
        { status: 404 }
      );
    }

    // 使用找到的記錄 ID 刪除
    const { error } = await supabase
      .from('field_operations_personnel')
      .delete()
      .eq('id', existingData.id);

    if (error) {
      console.error('刪除人員錯誤:', error);
      return NextResponse.json(
        { error: '刪除失敗', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '人員刪除成功',
      deleted: {
        id: existingData.id,
        personnel_id: existingData.personnel_id,
        name: existingData.name,
      },
    });

  } catch (error: any) {
    console.error('刪除人員錯誤:', error);
    return NextResponse.json(
      { error: '伺服器錯誤', message: error.message },
      { status: 500 }
    );
  }
}

