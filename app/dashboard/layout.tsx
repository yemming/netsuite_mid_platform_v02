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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        // 安全地創建 Supabase 客戶端
        let supabase
        try {
          supabase = createClient()
        } catch (clientError: any) {
          console.error('無法初始化 Supabase 客戶端:', clientError)
          router.push('/')
          setLoading(false)
          return
        }
        
        // 優化：只使用 getUser()，它已經包含了 session 檢查
        // 避免重複的 API 調用，減少等待時間
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Auth error:', userError)
          router.push('/')
          setLoading(false)
          return
        }
        
        if (!user) {
          router.push('/')
          setLoading(false)
          return
        }
        
        setUser(user)
        
        // 取得使用者頭像
        const { data: userProfile, error: userProfileError } = await supabase
          .from('user_profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .maybeSingle()
        
        if (!userProfileError && userProfile?.avatar_url) {
          setAvatarUrl(userProfile.avatar_url)
        }
        
        setLoading(false)
      } catch (err: any) {
        console.error('Check user error:', err)
        router.push('/')
        setLoading(false)
      }
    }
    checkUser()
    
    // 監聽頭像更新事件
    const handleAvatarUpdate = (event: CustomEvent) => {
      setAvatarUrl(event.detail.avatarUrl)
    }
    
    // 監聽姓名更新事件
    const handleNameUpdate = async () => {
      const supabase = createClient()
      const { data: { user: updatedUser } } = await supabase.auth.getUser()
      if (updatedUser) {
        setUser(updatedUser)
      }
    }
    
    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener)
    window.addEventListener('nameUpdated', handleNameUpdate as EventListener)
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener)
      window.removeEventListener('nameUpdated', handleNameUpdate as EventListener)
    }
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-[#28363F] rounded-full animate-spin" />
          <div className="text-sm text-gray-600 dark:text-gray-400">載入中...</div>
        </div>
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
        <nav className="sticky top-[6px] z-50 bg-white dark:bg-background">
          <div className="flex items-center gap-2 px-6 h-[38px] justify-end">
            <div className="flex items-center gap-1 flex-shrink-0">
              <ThemeToggle />
              <div 
                className="flex items-center space-x-2 ml-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push('/dashboard/profile')}
              >
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="頭像" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-foreground text-sm font-semibold">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-medium text-foreground leading-tight">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight">Administrator</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-xs font-medium ml-2 h-6 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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

