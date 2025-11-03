'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Sidebar from '@/components/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        // 安全地創建 Supabase 客戶端
        let supabase
        try {
          supabase = createClient()
        } catch (clientError: any) {
          console.error('無法初始化 Supabase 客戶端:', clientError)
          alert('應用程式設定錯誤，請聯繫管理員')
          setLoading(false)
          return
        }
        
        // 先檢查 session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Session check:', { session: !!session, error: sessionError })
        
        // 再檢查 user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('User check:', { user: !!user, email: user?.email, error: userError })
        
        if (userError) {
          console.error('Auth error:', userError)
          // 不要顯示 alert，直接重定向
          router.push('/')
          setLoading(false)
          return
        }
        
        if (!user) {
          console.warn('No user found')
          router.push('/')
          setLoading(false)
          return
        }
        
        // 檢查郵件是否已驗證（可選，視需求決定是否要求驗證）
        // if (user.email && !user.email_confirmed_at) {
        //   alert('請先驗證您的電子郵件地址')
        //   router.push('/')
        //   return
        // }
        
        setUser(user)
        setLoading(false)
      } catch (err: any) {
        console.error('Check user error:', err)
        // 不要顯示 alert，直接重定向
        router.push('/')
        setLoading(false)
      }
    }
    checkUser()
  }, [router])

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (err: any) {
      console.error('登出錯誤:', err)
      // 即使出錯也要重定向，確保用戶被登出
    } finally {
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-foreground">載入中...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Top Navbar - NetSuite Style with Camouflage Pattern */}
        <nav className="relative bg-card border-b border-border">
          {/* Modern Camouflage Top Bar - Visible in both light and dark modes */}
          <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <defs>
                {/* Light mode pattern - subtle blue-green tones */}
                <pattern id="camouflagePatternLight" x="0" y="0" width="200" height="4" patternUnits="userSpaceOnUse">
                  {/* Base - light gray-blue background */}
                  <rect width="200" height="4" fill="#C8D4DE"/>
                  
                  {/* Modern camouflage - abstract geometric blobs (light tones) */}
                  <ellipse cx="30" cy="2" rx="25" ry="1.8" fill="#A8B8C8" opacity="0.6"/>
                  <ellipse cx="60" cy="1.2" rx="20" ry="2.2" fill="#98A8B8" opacity="0.55"/>
                  <ellipse cx="90" cy="2.8" rx="28" ry="1.5" fill="#B8C8D8" opacity="0.65"/>
                  <ellipse cx="120" cy="0.8" rx="22" ry="2" fill="#88A8C8" opacity="0.5"/>
                  <ellipse cx="150" cy="3.2" rx="26" ry="1.3" fill="#A8C8D8" opacity="0.6"/>
                  <ellipse cx="175" cy="1.5" rx="18" ry="1.7" fill="#98B8C8" opacity="0.55"/>
                  
                  {/* Wavy lines for texture */}
                  <path d="M 0 0 Q 50 2 100 0.5 T 200 1" fill="none" stroke="#88A8B8" strokeWidth="0.4" opacity="0.4"/>
                  <path d="M 0 4 Q 55 2.5 110 3.5 T 200 4" fill="none" stroke="#78A8B8" strokeWidth="0.4" opacity="0.35"/>
                  <path d="M 25 0 Q 75 2.5 125 1 T 200 2" fill="none" stroke="#98B8C8" strokeWidth="0.3" opacity="0.3"/>
                  
                  {/* Small texture dots for depth */}
                  <circle cx="20" cy="2" r="1" fill="#88A8B8" opacity="0.5"/>
                  <circle cx="70" cy="1.5" r="0.8" fill="#78A8B8" opacity="0.45"/>
                  <circle cx="110" cy="2.5" r="0.9" fill="#88B8C8" opacity="0.55"/>
                  <circle cx="140" cy="1.8" r="0.7" fill="#98A8B8" opacity="0.4"/>
                  <circle cx="180" cy="2.2" r="0.6" fill="#88A8C8" opacity="0.35"/>
                </pattern>
                
                {/* Dark mode pattern - darker blue-green tones */}
                <pattern id="camouflagePatternDark" x="0" y="0" width="200" height="4" patternUnits="userSpaceOnUse">
                  {/* Base - subtle gradient background */}
                  <rect width="200" height="4" fill="#28363F"/>
                  
                  {/* Modern camouflage - abstract geometric blobs */}
                  <ellipse cx="30" cy="2" rx="25" ry="1.8" fill="#354a56" opacity="0.85"/>
                  <ellipse cx="60" cy="1.2" rx="20" ry="2.2" fill="#3a4f5d" opacity="0.75"/>
                  <ellipse cx="90" cy="2.8" rx="28" ry="1.5" fill="#2d434f" opacity="0.9"/>
                  <ellipse cx="120" cy="0.8" rx="22" ry="2" fill="#354a56" opacity="0.65"/>
                  <ellipse cx="150" cy="3.2" rx="26" ry="1.3" fill="#3a4f5d" opacity="0.8"/>
                  <ellipse cx="175" cy="1.5" rx="18" ry="1.7" fill="#2d434f" opacity="0.7"/>
                  
                  {/* Wavy lines for texture */}
                  <path d="M 0 0 Q 50 2 100 0.5 T 200 1" fill="none" stroke="#4a5f6d" strokeWidth="0.4" opacity="0.5"/>
                  <path d="M 0 4 Q 55 2.5 110 3.5 T 200 4" fill="none" stroke="#2d434f" strokeWidth="0.4" opacity="0.4"/>
                  <path d="M 25 0 Q 75 2.5 125 1 T 200 2" fill="none" stroke="#5a6f7d" strokeWidth="0.3" opacity="0.3"/>
                  
                  {/* Small texture dots for depth */}
                  <circle cx="20" cy="2" r="1" fill="#5a6f7d" opacity="0.6"/>
                  <circle cx="70" cy="1.5" r="0.8" fill="#4a5f6d" opacity="0.5"/>
                  <circle cx="110" cy="2.5" r="0.9" fill="#3a4f5d" opacity="0.7"/>
                  <circle cx="140" cy="1.8" r="0.7" fill="#5a6f7d" opacity="0.5"/>
                  <circle cx="180" cy="2.2" r="0.6" fill="#4a5f6d" opacity="0.4"/>
                </pattern>
              </defs>
              {/* Light mode */}
              <rect width="100%" height="100%" fill="url(#camouflagePatternLight)" className="dark:hidden"/>
              {/* Dark mode */}
              <rect width="100%" height="100%" fill="url(#camouflagePatternDark)" className="hidden dark:block"/>
            </svg>
          </div>
          
          {/* Main Navbar Content - Very Thin */}
          <div className="px-4 py-1.5">
            <div className="flex justify-between items-center">
              <div></div>
              <div className="flex items-center space-x-3">
                <ThemeToggle />
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#28363F] dark:bg-[#28363F] flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground leading-tight">{user?.email?.split('@')[0] || 'User'}</span>
                    <span className="text-xs text-muted-foreground leading-tight">Administrator</span>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1 bg-[#28363F] text-white rounded hover:bg-[#354a56] transition-colors text-xs font-medium"
                >
                  登出
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content - Responsive Background */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}

