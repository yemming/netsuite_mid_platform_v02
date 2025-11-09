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
  const [signingOut, setSigningOut] = useState(false)

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
    // 立即顯示載入狀態，提供即時反饋
    setSigningOut(true)
    
    // 立即重定向，不等待 API 回應
    router.push('/')
    
    // 在背景執行登出，即使失敗也不影響用戶體驗
    try {
      const supabase = createClient()
      // 使用 Promise.race 設定超時，避免長時間等待
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('登出超時')), 3000)
        )
      ])
    } catch (err: any) {
      // 靜默處理錯誤，因為已經重定向了
      console.error('登出錯誤（已忽略）:', err)
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
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-background">
        {/* Top Navbar - Fixed header aligned with sidebar */}
        <nav className="sticky top-[6px] z-50 bg-gray-50 dark:bg-[#28363F] text-gray-900 dark:text-white">
          <div className="flex items-center gap-2 px-6 h-[38px] justify-end">
            <div className="flex items-center gap-1 flex-shrink-0">
              <ThemeToggle />
              <div className="flex items-center space-x-2 ml-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-[#354a56] flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-700 dark:text-white text-xs font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{user?.email?.split('@')[0] || 'User'}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-300 leading-tight">Administrator</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="px-3 py-1 bg-gray-100 dark:bg-[#354a56] text-gray-700 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-[#3a4f5d] transition-colors text-xs font-medium ml-2 h-6 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signingOut ? '登出中...' : '登出'}
              </button>
            </div>
          </div>
        </nav>

        {/* Page Content - Scrollable with transparent overlay effect */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-background relative">
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

