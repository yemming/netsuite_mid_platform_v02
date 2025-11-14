'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { TrendingUp, CheckCircle2, XCircle, Loader2, LayoutDashboard } from 'lucide-react'

interface ConnectionStatus {
  connected: boolean
  loading: boolean
  message: string
  companyName?: string
}

export default function Dashboard() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [supabaseStatus, setSupabaseStatus] = useState<ConnectionStatus>({
    connected: false,
    loading: true,
    message: '檢查連線中...'
  })
  const [n8nStatus, setN8nStatus] = useState<ConnectionStatus>({
    connected: false,
    loading: false,
    message: '尚未整合'
  })
  const [netsuiteStatus, setNetsuiteStatus] = useState<ConnectionStatus>({
    connected: false,
    loading: false,
    message: '尚未整合'
  })

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setLoading(false)
      } else {
        setLoading(false)
      }
    }
    checkUser()
  }, [supabase])

  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const hasEnvVars = 
          process.env.NEXT_PUBLIC_SUPABASE_URL && 
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!hasEnvVars) {
          setSupabaseStatus({
            connected: false,
            loading: false,
            message: '環境變數未設定'
          })
          return
        }

        // 優化：只使用 getUser()，避免重複調用
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          throw userError
        }

        if (user) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
          let domainName = ''
          try {
            if (supabaseUrl) {
              const url = new URL(supabaseUrl)
              domainName = url.hostname.replace('.supabase.co', '') || url.hostname
            }
          } catch {
            domainName = supabaseUrl
          }

          setSupabaseStatus({
            connected: true,
            loading: false,
            message: '連線成功',
            companyName: domainName
          })
        } else {
          setSupabaseStatus({
            connected: false,
            loading: false,
            message: '認證失敗'
          })
        }
      } catch (error: any) {
        console.error('Supabase connection test error:', error)
        setSupabaseStatus({
          connected: false,
          loading: false,
          message: error.message || '連線失敗'
        })
      }
    }

    if (!loading) {
      checkSupabaseConnection()
    }
  }, [loading, supabase])

  // 優化：合併所有連接檢查到一個 useEffect，減少重複渲染
  useEffect(() => {
    if (loading) return

    const checkAllConnections = async () => {
      // 並行執行所有連接檢查，提升性能
      const [n8nResult, netsuiteResult] = await Promise.allSettled([
        // N8n 連接檢查
        (async () => {
          setN8nStatus({
            connected: false,
            loading: true,
            message: '檢查連線中...'
          })

          try {
            const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
            
            if (!webhookUrl) {
              return {
                connected: false,
                message: '環境變數未設定'
              }
            }

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000) // 減少超時時間到 5 秒

            let response: Response
            try {
              response = await fetch(webhookUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
              })
            } catch {
              clearTimeout(timeoutId)
              const controller2 = new AbortController()
              const timeoutId2 = setTimeout(() => controller2.abort(), 5000)
              
              response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'test_connection', timestamp: new Date().toISOString() }),
                signal: controller2.signal
              })
              clearTimeout(timeoutId2)
            }

            clearTimeout(timeoutId)

            if (response.ok) {
              const url = new URL(webhookUrl)
              return {
                connected: true,
                message: '連線成功',
                companyName: url.hostname
              }
            } else {
              return {
                connected: false,
                message: `連線失敗 (HTTP ${response.status})`
              }
            }
          } catch (error: any) {
            let errorMessage = '連線失敗'
            if (error.name === 'TimeoutError' || error.name === 'AbortError') {
              errorMessage = '連線超時'
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
              errorMessage = '網路錯誤或 CORS 問題'
            }
            return { connected: false, message: errorMessage }
          }
        })(),
        // NetSuite 連接檢查
        (async () => {
          setNetsuiteStatus({
            connected: false,
            loading: true,
            message: '檢查連線中...'
          })

          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000) // 減少超時時間到 5 秒

            const response = await fetch('/api/netsuite/test', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal
            })

            clearTimeout(timeoutId)
            const result = await response.json()

            if (result.success) {
              return {
                connected: true,
                message: result.message || '連線成功',
                companyName: result.companyName
              }
            } else {
              return {
                connected: false,
                message: result.message || '連線失敗'
              }
            }
          } catch (error: any) {
            return {
              connected: false,
              message: error.message || '連線失敗'
            }
          }
        })()
      ])

      // 更新 N8n 狀態
      if (n8nResult.status === 'fulfilled') {
        setN8nStatus({
          ...n8nResult.value,
          loading: false
        })
      } else {
        setN8nStatus({
          connected: false,
          loading: false,
          message: '檢查失敗'
        })
      }

      // 更新 NetSuite 狀態
      if (netsuiteResult.status === 'fulfilled') {
        setNetsuiteStatus({
          ...netsuiteResult.value,
          loading: false
        })
      } else {
        setNetsuiteStatus({
          connected: false,
          loading: false,
          message: '檢查失敗'
        })
      }
    }

    checkAllConnections()
  }, [loading])

  // Calculate connection stats
  const totalConnections = 3
  const connectedCount = [supabaseStatus, n8nStatus, netsuiteStatus].filter(s => s.connected).length
  const connectionRate = totalConnections > 0 ? (connectedCount / totalConnections) * 100 : 0

  return (
    <div className="bg-background">
      {/* Page Header - NetSuite Next UI Style */}
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">儀表板</h1>
        </div>
        <p className="text-muted-foreground">
          系統狀態總覽
        </p>
      </div>

      <div className="p-6">
        {/* KPI Cards - NetSuite Next UI Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Connection Status KPI */}
        <div className="bg-card border border-border rounded-md p-5 shadow-sm">
          <div className="text-xs text-muted-foreground mb-1">連接狀態</div>
          <div className="text-2xl font-semibold text-foreground mb-1">
            {connectedCount}/{totalConnections}
          </div>
          <div className="flex items-center text-xs">
            <span className={`font-medium ${connectionRate === 100 ? 'text-green-600 dark:text-green-500' : 'text-orange-600 dark:text-orange-500'}`}>
              {connectionRate === 100 ? '✓' : '⚠'} {Math.round(connectionRate)}%
            </span>
            <span className="text-muted-foreground ml-2">已連接</span>
          </div>
        </div>

        {/* System Health KPI */}
        <div className="bg-card border border-border rounded-md p-5 shadow-sm">
          <div className="text-xs text-muted-foreground mb-1">系統狀態</div>
          <div className="text-2xl font-semibold text-foreground mb-1">
            {connectionRate === 100 ? '正常' : '警告'}
          </div>
          <div className="flex items-center text-xs">
            <span className={`font-medium ${connectionRate === 100 ? 'text-green-600 dark:text-green-500' : 'text-orange-600 dark:text-orange-500'}`}>
              <TrendingUp className="w-4 h-4 inline mr-1" />
              {connectionRate === 100 ? '運行中' : '部分離線'}
            </span>
          </div>
        </div>

        {/* Active Services KPI */}
        <div className="bg-card border border-border rounded-md p-5 shadow-sm">
          <div className="text-xs text-muted-foreground mb-1">活躍服務</div>
          <div className="text-2xl font-semibold text-foreground mb-1">
            {connectedCount}
          </div>
          <div className="flex items-center text-xs">
            <span className="text-muted-foreground">服務運行中</span>
          </div>
        </div>

        {/* Uptime KPI */}
        <div className="bg-card border border-border rounded-md p-5 shadow-sm">
          <div className="text-xs text-muted-foreground mb-1">系統運行時間</div>
          <div className="text-2xl font-semibold text-foreground mb-1">
            99.9%
          </div>
          <div className="flex items-center text-xs">
            <span className="text-green-600 dark:text-green-500 font-medium">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              ↑ 穩定
            </span>
          </div>
        </div>
      </div>

      {/* Connection Cards - NetSuite Next UI Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Supabase Card */}
        <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-foreground">Supabase</h3>
              <div className="flex items-center">
                {supabaseStatus.loading ? (
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                ) : supabaseStatus.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
            </div>
            
            {supabaseStatus.companyName && (
              <div className="mb-2">
                <p className="text-sm font-semibold text-foreground">
                  {supabaseStatus.companyName}
                </p>
              </div>
            )}
            
            <p className={`text-xs ${
              supabaseStatus.connected ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {supabaseStatus.message}
            </p>
          </div>
        </div>

        {/* N8n Card */}
        <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-foreground">N8n</h3>
              <div className="flex items-center">
                {n8nStatus.loading ? (
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                ) : n8nStatus.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
            </div>
            
            {n8nStatus.companyName && (
              <div className="mb-2">
                <p className="text-sm font-semibold text-foreground">
                  {n8nStatus.companyName}
                </p>
              </div>
            )}
            
            <p className={`text-xs ${
              n8nStatus.connected ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {n8nStatus.message}
            </p>
          </div>
        </div>

        {/* NetSuite Card */}
        <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-foreground">NetSuite</h3>
              <div className="flex items-center">
                {netsuiteStatus.loading ? (
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                ) : netsuiteStatus.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
            </div>
            
            {netsuiteStatus.companyName && (
              <div className="mb-2">
                <p className="text-sm font-semibold text-foreground">
                  {netsuiteStatus.companyName}
                </p>
              </div>
            )}
            
            <p className={`text-xs ${
              netsuiteStatus.connected ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {netsuiteStatus.message}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-card border border-border rounded-md shadow-sm p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button className="px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-left">
            <div className="text-sm font-semibold">查看訂單</div>
            <div className="text-xs opacity-90 mt-0.5">瀏覽所有訂單記錄</div>
          </button>
          <button className="px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-left">
            <div className="text-sm font-semibold">執行查詢</div>
            <div className="text-xs opacity-90 mt-0.5">使用 SuiteQL 查詢資料</div>
          </button>
          <button className="px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-left">
            <div className="text-sm font-semibold">系統設定</div>
            <div className="text-xs opacity-90 mt-0.5">管理系統配置</div>
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
