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
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-background">
        {/* Top Navbar - Fixed header aligned with sidebar */}
        <nav className="sticky top-[6px] z-50 bg-white dark:bg-background text-gray-900 dark:text-white">
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
                className="px-3 py-1 bg-gray-100 dark:bg-[#354a56] text-gray-700 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-[#3a4f5d] transition-colors text-xs font-medium ml-2 h-6 flex items-center"
              >
                登出
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

