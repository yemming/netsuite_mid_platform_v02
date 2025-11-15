import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 臨時 API：執行 SQL 腳本
 * ⚠️ 注意：此端點僅用於開發環境，生產環境應移除或加強安全驗證
 */
export async function POST(request: Request) {
  try {
    // 檢查是否為開發環境（可選的安全檢查）
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: '此功能僅在開發環境可用' },
        { status: 403 }
      );
    }

    const { sql } = await request.json();

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { error: '請提供有效的 SQL 語句' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 使用 Supabase 的 REST API 執行 SQL
    // 注意：Supabase 的 JavaScript 客戶端不直接支援執行任意 SQL
    // 需要使用 Supabase Management API 或建立一個 PostgreSQL 函數
    
    // 替代方案：將 SQL 分割成多個語句並逐一執行
    // 但這需要建立一個 RPC 函數來執行 SQL
    
    // 最簡單的方式：建議用戶直接在 Supabase Dashboard 執行
    
    return NextResponse.json({
      success: false,
      message: '無法透過 API 直接執行 SQL。請在 Supabase Dashboard 的 SQL Editor 中執行 SQL 腳本。',
      suggestion: '請複製 create_field_operations_personnel_table.sql 的內容到 Supabase SQL Editor 執行',
    });

  } catch (error: any) {
    console.error('執行 SQL 錯誤:', error);
    return NextResponse.json(
      {
        error: '執行失敗',
        message: error.message || '無法執行 SQL',
      },
      { status: 500 }
    );
  }
}

