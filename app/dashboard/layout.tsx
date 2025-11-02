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
        const supabase = createClient()
        
        // 先檢查 session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Session check:', { session: !!session, error: sessionError })
        
        // 再檢查 user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('User check:', { user: !!user, email: user?.email, error: userError })
        
        if (userError) {
          console.error('Auth error:', userError)
          alert(`認證錯誤: ${userError.message}`)
          router.push('/')
          return
        }
        
        if (!user) {
          console.warn('No user found')
          alert('未登入，請重新登入')
          router.push('/')
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
        alert(`檢查用戶時發生錯誤: ${err.message}`)
        router.push('/')
      }
    }
    checkUser()
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-xl text-gray-900 dark:text-gray-100">載入中...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div></div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <span className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors text-sm"
                >
                  登出
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  )
}

