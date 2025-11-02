import { NextResponse } from 'next/server'

// 簡單的健康檢查端點
// 不依賴任何外部服務，只返回 OK 狀態
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 }
  )
}

