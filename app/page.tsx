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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* NetSuite Background Pattern - Blue-gray abstract geometric shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E8EEF2] via-[#D6E1E8] to-[#C4D4DE]">
        {/* Abstract cloud/data flow pattern */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-40">
            <defs>
              <radialGradient id="cloud1" cx="20%" cy="30%">
                <stop offset="0%" stopColor="#B8C8D8" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#B8C8D8" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#B8C8D8" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="cloud2" cx="75%" cy="65%">
                <stop offset="0%" stopColor="#A8B8C8" stopOpacity="0.5"/>
                <stop offset="50%" stopColor="#A8B8C8" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#A8B8C8" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="cloud3" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#C8D8E8" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#C8D8E8" stopOpacity="0"/>
              </radialGradient>
            </defs>
            {/* Cloud-like abstract shapes */}
            <ellipse cx="20%" cy="30%" rx="300" ry="200" fill="url(#cloud1)"/>
            <ellipse cx="75%" cy="65%" rx="280" ry="180" fill="url(#cloud2)"/>
            <ellipse cx="50%" cy="50%" rx="250" ry="150" fill="url(#cloud3)"/>
          </svg>
        </div>
        
        {/* Right edge geometric shapes - deep blue and yellow bands */}
        <div className="absolute right-0 top-0 bottom-0 w-40">
          {/* Deep blue vertical band with geometric cut */}
          <div className="absolute right-0 top-0 bottom-0 w-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1C3A5E" stopOpacity="0.7"/>
                  <stop offset="100%" stopColor="#1C3A5E" stopOpacity="0.5"/>
                </linearGradient>
              </defs>
              <polygon points="0,0 100%,15 100%,100% 0,100%" fill="url(#blueGrad)"/>
            </svg>
          </div>
          {/* Yellow vertical band */}
          <div className="absolute right-20 top-0 bottom-0 w-12">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="yellowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FDB515" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="#FDB515" stopOpacity="0.3"/>
                </linearGradient>
              </defs>
              <polygon points="0,10 100%,25 100%,100% 0,100%" fill="url(#yellowGrad)"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Login Card - White card centered */}
      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Logo at top left */}
        <div className="p-8 pb-6">
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#0073C5] focus:border-[#0073C5] transition-colors text-gray-900"
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#0073C5] focus:border-[#0073C5] transition-colors text-gray-900"
                placeholder="••••••••"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="data-[state=checked]:bg-[#0073C5] data-[state=checked]:border-[#0073C5]"
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium text-gray-700 cursor-pointer"
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

            {/* Log In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1C3A5E] text-white py-3 px-4 rounded flex items-center justify-center gap-2 hover:bg-[#254A6E] focus:outline-none focus:ring-2 focus:ring-[#0073C5] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
                className="text-sm text-[#0073C5] hover:text-[#005A9C] transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          </form>

          {/* Terms and Privacy Policy */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">
              By clicking on the Log In button, you understand and agree to{' '}
              <a href="#" className="text-[#0073C5] hover:underline">
                Terms of Use
              </a>
              {' '}and{' '}
              <a href="#" className="text-[#0073C5] hover:underline">
                Privacy Policy
              </a>
            </p>

            {/* Footer Links */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-col items-center space-y-2 text-xs">
                <div className="flex items-center space-x-3 text-[#0073C5]">
                  <a href="#" className="hover:underline">
                    NetSuite Status
                  </a>
                </div>
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

