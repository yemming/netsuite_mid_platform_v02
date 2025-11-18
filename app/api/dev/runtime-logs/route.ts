import { NextRequest, NextResponse } from 'next/server'
import { getRuntimeLogger } from '@/lib/runtime-logger'

// 初始化日誌收集器（只在開發環境）
if (process.env.NODE_ENV === 'development') {
  const logger = getRuntimeLogger()
  logger.log('info', 'Runtime Logs API initialized', '日誌收集系統已啟動')
}

// GET: 獲取日誌
export async function GET(request: NextRequest) {
  try {
    const logger = getRuntimeLogger()
    const searchParams = request.nextUrl.searchParams
    const since = searchParams.get('since') // 獲取指定時間之後的日誌
    const limit = parseInt(searchParams.get('limit') || '100')

    const filteredLogs = logger.getLogs(since || undefined, limit)

    return NextResponse.json({
      logs: filteredLogs,
      total: logger.getTotal(),
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch logs', message: error.message },
      { status: 500 }
    )
  }
}

// POST: 清除日誌
export async function POST(request: NextRequest) {
  try {
    const logger = getRuntimeLogger()
    const body = await request.json()
    
    if (body.action === 'clear') {
      logger.clear()
      return NextResponse.json({ message: 'Logs cleared', total: 0 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to clear logs', message: error.message },
      { status: 500 }
    )
  }
}

