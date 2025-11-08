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
    <div className="min-h-screen flex items-start justify-center relative overflow-hidden pt-16 pb-8" style={{
      backgroundColor: '#f5f7fa'
    }}>
      {/* Abstract Organic Shapes Background */}
      <div className="absolute inset-0 overflow-hidden">
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 1200 800" 
          preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            {/* Gradients for organic shapes */}
            <linearGradient id="mintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a8e6cf" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#88d8c0" stopOpacity="0.4"/>
            </linearGradient>
            <linearGradient id="coralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff9a8b" stopOpacity="0.7"/>
              <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0.5"/>
            </linearGradient>
            <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbc2eb" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#f8a5c2" stopOpacity="0.4"/>
            </linearGradient>
            <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c8a8e9" stopOpacity="0.7"/>
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.5"/>
            </linearGradient>
            <linearGradient id="coralGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff8a80" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0.4"/>
            </linearGradient>
            
            {/* Texture pattern for purple shape */}
            <pattern id="texturePattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="#a78bfa" opacity="0.3"/>
              <circle cx="10" cy="10" r="1" fill="#c8a8e9" opacity="0.2"/>
              <circle cx="30" cy="30" r="1" fill="#c8a8e9" opacity="0.2"/>
              <path d="M10,20 Q20,10 30,20 T50,20" stroke="#a78bfa" strokeWidth="0.5" fill="none" opacity="0.2"/>
              <path d="M20,10 Q20,20 20,30 T20,50" stroke="#c8a8e9" strokeWidth="0.5" fill="none" opacity="0.2"/>
            </pattern>
            
            {/* Blur filters */}
            <filter id="blur20">
              <feGaussianBlur in="SourceGraphic" stdDeviation="20"/>
            </filter>
            <filter id="blur25">
              <feGaussianBlur in="SourceGraphic" stdDeviation="25"/>
            </filter>
            <filter id="blur22">
              <feGaussianBlur in="SourceGraphic" stdDeviation="22"/>
            </filter>
            <filter id="blur18">
              <feGaussianBlur in="SourceGraphic" stdDeviation="18"/>
            </filter>
            <filter id="blur15">
              <feGaussianBlur in="SourceGraphic" stdDeviation="15"/>
            </filter>
          </defs>
          
          {/* Large mint/teal shape - top right */}
          <ellipse 
            cx="900" 
            cy="150" 
            rx="280" 
            ry="200" 
            fill="url(#mintGrad)" 
            transform="rotate(-25 900 150)"
            filter="url(#blur20)"
          />
          <ellipse 
            cx="920" 
            cy="170" 
            rx="250" 
            ry="180" 
            fill="url(#mintGrad)" 
            transform="rotate(-20 920 170)"
            opacity="0.8"
          />
          
          {/* Coral/red shape - middle right */}
          <ellipse 
            cx="950" 
            cy="350" 
            rx="300" 
            ry="220" 
            fill="url(#coralGrad)" 
            transform="rotate(35 950 350)"
            filter="url(#blur25)"
          />
          <ellipse 
            cx="970" 
            cy="370" 
            rx="270" 
            ry="200" 
            fill="url(#coralGrad)" 
            transform="rotate(30 970 370)"
            opacity="0.85"
          />
          
          {/* Pink shape - middle left */}
          <ellipse 
            cx="200" 
            cy="450" 
            rx="320" 
            ry="240" 
            fill="url(#pinkGrad)" 
            transform="rotate(-40 200 450)"
            filter="url(#blur22)"
          />
          <ellipse 
            cx="220" 
            cy="470" 
            rx="290" 
            ry="220" 
            fill="url(#pinkGrad)" 
            transform="rotate(-35 220 470)"
            opacity="0.8"
          />
          
          {/* Second coral shape - bottom right */}
          <ellipse 
            cx="850" 
            cy="650" 
            rx="280" 
            ry="200" 
            fill="url(#coralGrad2)" 
            transform="rotate(50 850 650)"
            filter="url(#blur20)"
          />
          <ellipse 
            cx="870" 
            cy="670" 
            rx="250" 
            ry="180" 
            fill="url(#coralGrad2)" 
            transform="rotate(45 870 670)"
            opacity="0.75"
          />
          
          {/* Purple shape with texture - bottom */}
          <ellipse 
            cx="500" 
            cy="700" 
            rx="350" 
            ry="250" 
            fill="url(#purpleGrad)" 
            transform="rotate(-15 500 700)"
            filter="url(#blur18)"
          />
          <ellipse 
            cx="520" 
            cy="720" 
            rx="320" 
            ry="230" 
            fill="url(#purpleGrad)" 
            transform="rotate(-10 520 720)"
            opacity="0.9"
          />
          {/* Texture overlay for purple shape */}
          <ellipse 
            cx="520" 
            cy="720" 
            rx="300" 
            ry="210" 
            fill="url(#texturePattern)" 
            transform="rotate(-10 520 720)"
            opacity="0.4"
          />
          
          {/* Additional smaller overlapping shapes for depth */}
          <ellipse 
            cx="750" 
            cy="250" 
            rx="180" 
            ry="140" 
            fill="url(#mintGrad)" 
            transform="rotate(15 750 250)"
            opacity="0.5"
            filter="url(#blur15)"
          />
          <ellipse 
            cx="300" 
            cy="300" 
            rx="200" 
            ry="150" 
            fill="url(#pinkGrad)" 
            transform="rotate(-25 300 300)"
            opacity="0.4"
            filter="url(#blur18)"
          />
        </svg>
      </div>

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
                className="w-full px-3 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#0073C5] focus:border-[#0073C5] transition-colors text-gray-900 bg-white"
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
                style={{ backgroundColor: '#E0F2F7' }}
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

