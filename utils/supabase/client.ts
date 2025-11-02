import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = []
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    console.error('Supabase 環境變數未設置:', missing.join(', '))
    console.error('當前環境變數:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      nodeEnv: process.env.NODE_ENV,
    })
    
    throw new Error(`Supabase 環境變數未設置: ${missing.join(', ')}`)
  }

  try {
    return createBrowserClient(
      supabaseUrl,
      supabaseAnonKey
    )
  } catch (error: any) {
    console.error('創建 Supabase 客戶端失敗:', error)
    throw new Error(`無法初始化 Supabase 客戶端: ${error.message}`)
  }
}

