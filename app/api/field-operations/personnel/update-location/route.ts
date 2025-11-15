import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 更新當前使用者的 GPS 位置
 * POST /api/field-operations/personnel/update-location
 * 
 * 請求體：
 * {
 *   latitude: number (必填)
 *   longitude: number (必填)
 *   accuracy?: number (可選)
 *   address?: string (可選)
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
    const { latitude, longitude, accuracy, address } = body;

    // 驗證必填欄位
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: '缺少必要欄位', required: ['latitude', 'longitude'] },
        { status: 400 }
      );
    }

    // 驗證座標範圍
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: '無效的座標範圍' },
        { status: 400 }
      );
    }

    // 準備 location 資料
    const locationData = {
      latitude,
      longitude,
      lastUpdated: new Date().toISOString(),
      ...(accuracy !== undefined && { accuracy }),
      ...(address && { address }),
    };

    // 先找到對應的 personnel 記錄（使用 user_id）
    const { data: existingPersonnel, error: findError } = await supabase
      .from('field_operations_personnel')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (findError) {
      console.error('查詢人員記錄錯誤:', findError);
      return NextResponse.json(
        { error: '查詢失敗', message: findError.message },
        { status: 500 }
      );
    }

    if (!existingPersonnel) {
      return NextResponse.json(
        { error: '找不到對應的人員記錄，請先建立人員資料' },
        { status: 404 }
      );
    }

    // 更新 location
    const { data, error } = await supabase
      .from('field_operations_personnel')
      .update({ location: locationData })
      .eq('id', existingPersonnel.id)
      .select()
      .single();

    if (error) {
      console.error('更新 GPS 位置錯誤:', error);
      return NextResponse.json(
        { error: '更新失敗', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'GPS 位置更新成功',
      data: {
        location: locationData,
      },
    });

  } catch (error: any) {
    console.error('更新 GPS 位置錯誤:', error);
    return NextResponse.json(
      { error: '伺服器錯誤', message: error.message },
      { status: 500 }
    );
  }
}

