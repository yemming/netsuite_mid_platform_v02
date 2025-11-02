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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-xl text-gray-900">載入中...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Top Navbar - NetSuite Style */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Updated just now</span>
                <button className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors">
                  Personalize view
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a3d2e] flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{user?.email?.split('@')[0] || 'User'}</span>
                    <span className="text-xs text-gray-500">Administrator</span>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-[#1a3d2e] text-white rounded-lg hover:bg-[#2a4d3e] transition-colors text-sm font-medium"
                >
                  登出
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content - White Background */}
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  )
}

