import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 上傳人員照片
 * POST /api/field-operations/personnel/upload-avatar
 * 
 * 請求格式：FormData
 * - file: File (圖片檔案)
 * - personnel_id: string (人員識別碼，用於檔案命名)
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const personnelId = formData.get('personnel_id') as string;

    if (!file) {
      return NextResponse.json(
        { error: '請提供圖片檔案' },
        { status: 400 }
      );
    }

    if (!personnelId) {
      return NextResponse.json(
        { error: '請提供人員識別碼' },
        { status: 400 }
      );
    }

    // 驗證檔案類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支援的檔案類型，僅支援 JPEG、PNG、WebP' },
        { status: 400 }
      );
    }

    // 驗證檔案大小（限制 5MB）
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: '檔案大小超過限制（最大 5MB）' },
        { status: 400 }
      );
    }

    // 產生檔案名稱
    const fileExt = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const fileName = `personnel/${personnelId}/${timestamp}.${fileExt}`;

    // 上傳到 Supabase Storage
    // 注意：需要先建立 'personnel-avatars' bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('personnel-avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true, // 如果檔案已存在則覆蓋
      });

    if (uploadError) {
      console.error('上傳照片錯誤:', uploadError);
      return NextResponse.json(
        { error: '上傳失敗', message: uploadError.message },
        { status: 500 }
      );
    }

    // 由於 bucket 是 Private，使用 Signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('personnel-avatars')
      .createSignedUrl(fileName, 31536000); // 1 年有效期

    if (signedUrlError || !signedUrlData) {
      console.error('建立 Signed URL 錯誤:', signedUrlError);
      return NextResponse.json(
        { error: '無法建立照片存取連結', message: signedUrlError?.message },
        { status: 500 }
      );
    }

    const avatarUrl = signedUrlData.signedUrl;

    return NextResponse.json({
      success: true,
      message: '照片上傳成功',
      data: {
        url: avatarUrl,
        fileName,
      },
    });

  } catch (error: any) {
    console.error('上傳照片錯誤:', error);
    return NextResponse.json(
      { error: '伺服器錯誤', message: error.message },
      { status: 500 }
    );
  }
}

