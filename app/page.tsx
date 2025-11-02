'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  
  // 安全地創建 Supabase 客戶端
  let supabase: ReturnType<typeof createClient> | null = null
  try {
    supabase = createClient()
  } catch (err: any) {
    console.error('Supabase 初始化錯誤:', err)
    setSupabaseError(err.message || 'Supabase 初始化失敗')
  }

  useEffect(() => {
    if (!supabase) return
    
    const checkUser = async () => {
      try {
        // 先檢查 session
        const { data: { session: sessionData }, error: sessionError } = await supabase.auth.getSession()
        console.log('當前 session:', !!sessionData, '錯誤:', sessionError)
        
        // 再檢查 user
        const { data: { user }, error } = await supabase.auth.getUser()
        console.log('當前用戶:', user?.email || '無', '錯誤:', error)
        
        if (error) {
          console.error('檢查用戶時發生錯誤:', error)
          // 如果只是 session 過期，不要阻擋
          if (error.message?.includes('JWT')) {
            return
          }
        }
        if (user && sessionData) {
          router.push('/dashboard')
        }
      } catch (err: any) {
        console.error('檢查用戶失敗:', err)
      }
    }
    checkUser()
  }, [router, supabase])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase) {
      setError('Supabase 未初始化，無法登入。請檢查環境變數設定。')
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const redirectUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/dashboard`
          : 'https://netsuite-mid-platform-v02.zeabur.app/dashboard'
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        })
        
        if (error) throw error
        
        if (data.user && !data.session) {
          // 需要郵件驗證
          alert('註冊成功！請檢查您的電子郵件以驗證帳號。')
        } else if (data.session) {
          // 直接登入成功
          router.push('/dashboard')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) {
          console.error('登入錯誤:', error)
          throw error
        }
        
        if (data.session) {
          console.log('登入成功，session:', !!data.session)
          console.log('Session details:', {
            access_token: !!data.session.access_token,
            refresh_token: !!data.session.refresh_token,
            expires_at: data.session.expires_at,
          })
          
          // 等待一小段時間確保 session 已寫入 cookie
          await new Promise(resolve => setTimeout(resolve, 100))
          
          router.push('/dashboard')
          // 強制重新載入以確保 session 生效
          router.refresh()
        } else {
          console.error('登入失敗：無法建立 session', data)
          setError('登入失敗：無法建立 session。請檢查 Supabase 設定。')
        }
      }
    } catch (error: any) {
      console.error('認證錯誤:', error)
      setError(error.message || '發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          NetSuite Platform V2
        </h1>
        
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              電子郵件
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密碼
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="至少 6 個字元"
            />
          </div>

          {supabaseError && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg text-sm mb-4">
              <strong>⚠️ 設定錯誤：</strong> {supabaseError}
              <div className="mt-2 text-xs">
                請確認 Zeabur 環境變數已正確設置：
                <ul className="list-disc list-inside mt-1">
                  <li>NEXT_PUBLIC_SUPABASE_URL</li>
                  <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                </ul>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '處理中...' : isSignUp ? '註冊' : '登入'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {isSignUp ? '已有帳號？立即登入' : '還沒有帳號？立即註冊'}
          </button>
        </div>
      </div>
    </div>
  )
}

