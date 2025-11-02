'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { TrendingUp, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

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

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          throw userError
        }

        if (user) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            throw sessionError
          }

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

  useEffect(() => {
    const checkN8nWebhook = async () => {
      setN8nStatus({
        connected: false,
        loading: true,
        message: '檢查連線中...'
      })

      try {
        const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
        
        if (!webhookUrl) {
          setN8nStatus({
            connected: false,
            loading: false,
            message: '環境變數未設定'
          })
          return
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        let response: Response
        try {
          response = await fetch(webhookUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: controller.signal
          })
        } catch (getError: any) {
          clearTimeout(timeoutId)
          const controller2 = new AbortController()
          const timeoutId2 = setTimeout(() => controller2.abort(), 10000)
          
          response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'test_connection',
              timestamp: new Date().toISOString(),
              source: 'dashboard'
            }),
            signal: controller2.signal
          })
          
          clearTimeout(timeoutId2)
        }

        clearTimeout(timeoutId)

        if (response.ok) {
          const responseText = await response.text()
          
          let domainName = ''
          try {
            if (webhookUrl) {
              const url = new URL(webhookUrl)
              domainName = url.hostname
            }
          } catch {
            domainName = webhookUrl
          }

          setN8nStatus({
            connected: true,
            loading: false,
            message: '連線成功',
            companyName: domainName
          })
        } else {
          setN8nStatus({
            connected: false,
            loading: false,
            message: `連線失敗 (HTTP ${response.status})`
          })
        }
      } catch (error: any) {
        console.error('N8n webhook test error:', error)
        
        let errorMessage = '連線失敗'
        
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          errorMessage = '連線超時'
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMessage = '網路錯誤或 CORS 問題'
        } else if (error.message) {
          errorMessage = `連線失敗: ${error.message}`
        }
        
        setN8nStatus({
          connected: false,
          loading: false,
          message: errorMessage
        })
      }
    }

    if (!loading) {
      checkN8nWebhook()
    }
  }, [loading])

  useEffect(() => {
    const checkNetSuiteConnection = async () => {
      setNetsuiteStatus({
        connected: false,
        loading: true,
        message: '檢查連線中...'
      })

      try {
        const response = await fetch('/api/netsuite/test', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const result = await response.json()

        if (result.success) {
          setNetsuiteStatus({
            connected: true,
            loading: false,
            message: result.message || '連線成功',
            companyName: result.companyName
          })
        } else {
          setNetsuiteStatus({
            connected: false,
            loading: false,
            message: result.message || '連線失敗'
          })
        }
      } catch (error: any) {
        console.error('NetSuite connection test error:', error)
        setNetsuiteStatus({
          connected: false,
          loading: false,
          message: error.message || '連線失敗'
        })
      }
    }

    if (!loading) {
      checkNetSuiteConnection()
    }
  }, [loading])

  // Calculate connection stats
  const totalConnections = 3
  const connectedCount = [supabaseStatus, n8nStatus, netsuiteStatus].filter(s => s.connected).length
  const connectionRate = totalConnections > 0 ? (connectedCount / totalConnections) * 100 : 0

  return (
    <div className="p-6 bg-white">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">儀表板</h1>
        <p className="text-gray-500">歡迎來到您的主要控制中心</p>
      </div>

      {/* KPI Cards - NetSuite Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Connection Status KPI */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">連接狀態</div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {connectedCount}/{totalConnections}
          </div>
          <div className="flex items-center text-sm">
            <span className={`font-medium ${connectionRate === 100 ? 'text-green-600' : 'text-orange-600'}`}>
              {connectionRate === 100 ? '✓' : '⚠'} {Math.round(connectionRate)}%
            </span>
            <span className="text-gray-500 ml-2">已連接</span>
          </div>
        </div>

        {/* System Health KPI */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">系統狀態</div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {connectionRate === 100 ? '正常' : '警告'}
          </div>
          <div className="flex items-center text-sm">
            <span className={`font-medium ${connectionRate === 100 ? 'text-green-600' : 'text-orange-600'}`}>
              <TrendingUp className="w-4 h-4 inline mr-1" />
              {connectionRate === 100 ? '運行中' : '部分離線'}
            </span>
          </div>
        </div>

        {/* Active Services KPI */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">活躍服務</div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {connectedCount}
          </div>
          <div className="flex items-center text-sm">
            <span className="text-gray-500">服務運行中</span>
          </div>
        </div>

        {/* Uptime KPI */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">系統運行時間</div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            99.9%
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-600 font-medium">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              ↑ 穩定
            </span>
          </div>
        </div>
      </div>

      {/* Connection Cards - NetSuite Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Supabase Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Supabase</h3>
              <div className="flex items-center">
                {supabaseStatus.loading ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : supabaseStatus.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
            
            {supabaseStatus.companyName && (
              <div className="mb-3">
                <p className="text-base font-semibold text-gray-900">
                  {supabaseStatus.companyName}
                </p>
              </div>
            )}
            
            <p className={`text-sm ${
              supabaseStatus.connected ? 'text-gray-600' : 'text-gray-500'
            }`}>
              {supabaseStatus.message}
            </p>
          </div>
        </div>

        {/* N8n Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">N8n</h3>
              <div className="flex items-center">
                {n8nStatus.loading ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : n8nStatus.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
            
            {n8nStatus.companyName && (
              <div className="mb-3">
                <p className="text-base font-semibold text-gray-900">
                  {n8nStatus.companyName}
                </p>
              </div>
            )}
            
            <p className={`text-sm ${
              n8nStatus.connected ? 'text-gray-600' : 'text-gray-500'
            }`}>
              {n8nStatus.message}
            </p>
          </div>
        </div>

        {/* NetSuite Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">NetSuite</h3>
              <div className="flex items-center">
                {netsuiteStatus.loading ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : netsuiteStatus.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
            
            {netsuiteStatus.companyName && (
              <div className="mb-3">
                <p className="text-base font-semibold text-gray-900">
                  {netsuiteStatus.companyName}
                </p>
              </div>
            )}
            
            <p className={`text-sm ${
              netsuiteStatus.connected ? 'text-gray-600' : 'text-gray-500'
            }`}>
              {netsuiteStatus.message}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="px-4 py-3 bg-[#1a3d2e] text-white rounded-lg hover:bg-[#2a4d3e] transition-colors text-left">
            <div className="font-semibold">查看訂單</div>
            <div className="text-sm opacity-90">瀏覽所有訂單記錄</div>
          </button>
          <button className="px-4 py-3 bg-[#1a3d2e] text-white rounded-lg hover:bg-[#2a4d3e] transition-colors text-left">
            <div className="font-semibold">執行查詢</div>
            <div className="text-sm opacity-90">使用 SuiteQL 查詢資料</div>
          </button>
          <button className="px-4 py-3 bg-[#1a3d2e] text-white rounded-lg hover:bg-[#2a4d3e] transition-colors text-left">
            <div className="font-semibold">系統設定</div>
            <div className="text-sm opacity-90">管理系統配置</div>
          </button>
        </div>
      </div>
    </div>
  )
}
