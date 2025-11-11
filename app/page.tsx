'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Lock } from 'lucide-react'
import NetSuiteLogo from '@/components/netsuite-logo'
import { Checkbox } from '@/components/ui/checkbox'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  
  // 安全地創建 Supabase 客戶端（在客戶端環境中）
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const client = createClient()
      setSupabase(client)
    } catch (err: any) {
      console.error('Supabase 初始化錯誤:', err)
      setSupabaseError(err.message || 'Supabase 初始化失敗')
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    
    const checkUser = async () => {
      try {
        // 優化：只使用 getUser()，它已經包含了 session 檢查
        // 避免重複的 API 調用
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          // 如果只是 session 過期或 JWT 錯誤，靜默處理
          if (error.message?.includes('JWT') || error.message?.includes('session')) {
            return
          }
          console.error('檢查用戶時發生錯誤:', error)
          return
        }
        
        // 如果有用戶，直接跳轉
        if (user) {
          router.push('/dashboard')
        }
      } catch (err: any) {
        // 靜默處理錯誤，避免阻塞用戶體驗
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
          // 直接跳轉，不需要等待
          // Supabase 會自動處理 session cookie
          router.push('/dashboard')
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
    <div className="min-h-screen flex items-start justify-center relative overflow-hidden pt-16 pb-8" style={{
      backgroundColor: '#f5f7fa'
    }}>
      {/* 優化：使用 CSS 漸變背景替代複雜的 SVG，提升渲染性能 */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 75% 20%, rgba(168, 230, 207, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 45%, rgba(255, 154, 139, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 20% 60%, rgba(251, 194, 235, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(255, 138, 128, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 90%, rgba(200, 168, 233, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, #f5f7fa 0%, #e8ecf0 100%)
          `,
        }}
      />

      {/* Login Card - NetSuite Style Clean White Card */}
      <div className="bg-white shadow-xl w-full max-w-md mx-4 border border-gray-200 relative z-10" style={{
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
        borderRadius: '0.75rem' // 增加 50% 圓角，從 rounded-lg (0.5rem/8px) 增加到 0.75rem (12px)
      }}>
        {/* Logo centered */}
        <div className="p-8 pb-6 flex justify-center">
          <NetSuiteLogo />
        </div>

        {/* Card Content */}
        <div className="px-8 pb-8">
          {/* Login Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Log In
          </h1>
          
          <form onSubmit={handleAuth} className="space-y-5">
            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-500 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#0073C5] focus:border-[#0073C5] transition-colors"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#111827',
                }}
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-500 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#0073C5] focus:border-[#0073C5] transition-colors"
                style={{
                  backgroundColor: '#E0F2F7',
                  color: '#111827',
                }}
                placeholder="••••••••"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="border-gray-900 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium text-gray-500 cursor-pointer"
              >
                Remember Me
              </label>
            </div>

            {/* Error Messages */}
            {supabaseError && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Log In Button - NetSuite Style */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-2.5 px-4 rounded flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              style={{ 
                backgroundColor: '#354A56',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#3a5562'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#354A56'
              }}
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? '處理中...' : isSignUp ? '註冊' : 'Log In'}</span>
            </button>

            {/* Forgot Password */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  // TODO: Implement forgot password functionality
                  setError('忘記密碼功能尚未實現')
                }}
                className="text-sm transition-colors hover:underline"
                style={{ color: '#354A56' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#4a6572'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#354A56'}
              >
                Forgot your password?
              </button>
            </div>
          </form>

          {/* Terms and Privacy Policy */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">
              By clicking on the Log In button, you understand and agree to{' '}
              <a href="#" className="hover:underline transition-colors" style={{ color: '#354A56' }}>
                Terms of Use
              </a>
              {' '}and{' '}
              <a href="#" className="hover:underline transition-colors" style={{ color: '#354A56' }}>
                Privacy Policy
              </a>
            </p>

            {/* Footer Links */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 text-xs text-gray-500">
                <a href="#" className="hover:underline transition-colors whitespace-nowrap" style={{ color: '#354A56' }}>
                  Terms of Use for NetSuite Support Portal
                </a>
                <span className="text-gray-300">|</span>
                <a href="#" className="hover:underline transition-colors whitespace-nowrap" style={{ color: '#354A56' }}>
                  NetSuite Status
                </a>
              </div>
            </div>
          </div>

          {/* Sign Up / Sign In Toggle (for existing functionality) */}
          {!isSignUp && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true)
                  setError(null)
                }}
                className="text-sm text-[#0073C5] hover:text-[#005A9C] transition-colors"
              >
                還沒有帳號？立即註冊
              </button>
            </div>
          )}
          {isSignUp && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false)
                  setError(null)
                }}
                className="text-sm text-[#0073C5] hover:text-[#005A9C] transition-colors"
              >
                已有帳號？立即登入
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

