'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

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
        // 檢查環境變數是否設定
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

        // 測試 Supabase 連線 - 取得使用者資訊來驗證認證系統
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          throw userError
        }

        // 如果成功取得使用者，表示 Supabase 認證系統連線正常
        if (user) {
          // 進一步測試 Supabase 服務是否可正常使用
          // 嘗試取得 session 來確認完整連線
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            throw sessionError
          }

          // 從 Supabase URL 提取 domain name
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
      // 設定為檢查中
      setN8nStatus({
        connected: false,
        loading: true,
        message: '檢查連線中...'
      })

      try {
        // 檢查環境變數是否設定
        const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
        
        if (!webhookUrl) {
          setN8nStatus({
            connected: false,
            loading: false,
            message: '環境變數未設定'
          })
          return
        }

        console.log('測試 N8n webhook:', webhookUrl)

        // 設定 10 秒超時
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        // 先嘗試 GET 請求（因為 Postman 使用 GET 成功）
        let response: Response
        try {
          response = await fetch(webhookUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: controller.signal
          })
          console.log('GET 請求回應:', response.status, response.statusText)
        } catch (getError: any) {
          // 如果 GET 失敗，嘗試 POST
          console.log('GET 請求失敗，嘗試 POST:', getError.message)
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
          console.log('POST 請求回應:', response.status, response.statusText)
        }

        clearTimeout(timeoutId)

        // 檢查回應狀態
        if (response.ok) {
          // 嘗試取得回應內容
          const responseText = await response.text()
          console.log('N8n 回應內容:', responseText)
          
          // 嘗試解析 JSON（如果有的話）
          try {
            const data = JSON.parse(responseText)
            console.log('N8n 回應 JSON:', data)
          } catch {
            // 不是 JSON 格式也沒關係
            console.log('N8n 回應為非 JSON 格式')
          }
          
          // 從 webhook URL 提取 domain name
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
          // HTTP 狀態碼不是 2xx
          const errorText = await response.text().catch(() => '')
          console.error('N8n webhook 回應錯誤:', response.status, errorText)
          setN8nStatus({
            connected: false,
            loading: false,
            message: `連線失敗 (HTTP ${response.status})`
          })
        }
      } catch (error: any) {
        console.error('N8n webhook test error:', error)
        console.error('錯誤詳情:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
        
        // 處理不同的錯誤類型
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

    // 當用戶登入成功後，測試 N8n webhook
    if (!loading) {
      checkN8nWebhook()
    }
  }, [loading])

  useEffect(() => {
    const checkNetSuiteConnection = async () => {
      // 設定為檢查中
      setNetsuiteStatus({
        connected: false,
        loading: true,
        message: '檢查連線中...'
      })

      try {
        // 呼叫 API route 來測試 NetSuite 連線
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
          console.log('NetSuite 連線成功:', result.data)
          console.log('NetSuite 公司名稱:', result.companyName)
        } else {
          setNetsuiteStatus({
            connected: false,
            loading: false,
            message: result.message || '連線失敗'
          })
          console.error('NetSuite 連線失敗:', result.message)
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

    // 當用戶登入成功後，測試 NetSuite 連線
    if (!loading) {
      checkNetSuiteConnection()
    }
  }, [loading])

  return (
    <div className="p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Welcome to NextJS
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            歡迎來到儀表板！這裡是您的主要控制中心。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* Supabase Card */}
            <div className={`p-6 rounded-lg border-2 ${
              supabaseStatus.connected 
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700' 
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold ${
                  supabaseStatus.connected ? 'text-indigo-800 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Supabase
                </h3>
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${
                    supabaseStatus.loading 
                      ? 'bg-yellow-400 animate-pulse' 
                      : supabaseStatus.connected 
                        ? 'bg-green-500 shadow-green-500/50' 
                        : 'bg-red-500 shadow-red-500/50'
                  } shadow-lg ring-2 ${
                    supabaseStatus.connected 
                      ? 'ring-green-200' 
                      : 'ring-red-200'
                  }`} title={
                    supabaseStatus.loading 
                      ? '檢查中...' 
                      : supabaseStatus.connected 
                        ? '已連線' 
                        : '未連線'
                  } />
                </div>
              </div>
              
              {/* Domain name 顯示 */}
              {supabaseStatus.connected && supabaseStatus.companyName && (
                <div className="mb-3">
                  <p className={`text-base font-semibold ${
                    supabaseStatus.connected ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {supabaseStatus.companyName}
                  </p>
                </div>
              )}
              
              <p className={`text-sm ${
                supabaseStatus.connected ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {supabaseStatus.message}
              </p>
            </div>
            
            {/* N8n Card */}
            <div className={`p-6 rounded-lg border-2 ${
              n8nStatus.connected 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold ${
                  n8nStatus.connected ? 'text-green-800 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  N8n
                </h3>
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${
                    n8nStatus.loading 
                      ? 'bg-yellow-400 animate-pulse' 
                      : n8nStatus.connected 
                        ? 'bg-green-500 shadow-green-500/50' 
                        : 'bg-red-500 shadow-red-500/50'
                  } shadow-lg ring-2 ${
                    n8nStatus.connected 
                      ? 'ring-green-200' 
                      : 'ring-red-200'
                  }`} title={
                    n8nStatus.loading 
                      ? '檢查中...' 
                      : n8nStatus.connected 
                        ? '已連線' 
                        : '未連線'
                  } />
                </div>
              </div>
              
              {/* Domain name 顯示 */}
              {n8nStatus.connected && n8nStatus.companyName && (
                <div className="mb-3">
                  <p className={`text-base font-semibold ${
                    n8nStatus.connected ? 'text-green-900 dark:text-green-200' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {n8nStatus.companyName}
                  </p>
                </div>
              )}
              
              <p className={`text-sm ${
                n8nStatus.connected ? 'text-gray-700' : 'text-gray-500'
              }`}>
                {n8nStatus.message}
              </p>
            </div>
            
            {/* NetSuite Card */}
            <div className={`p-6 rounded-lg border-2 ${
              netsuiteStatus.connected 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold ${
                  netsuiteStatus.connected ? 'text-blue-800 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  NetSuite
                </h3>
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${
                    netsuiteStatus.loading 
                      ? 'bg-yellow-400 animate-pulse' 
                      : netsuiteStatus.connected 
                        ? 'bg-green-500 shadow-green-500/50' 
                        : 'bg-red-500 shadow-red-500/50'
                  } shadow-lg ring-2 ${
                    netsuiteStatus.connected 
                      ? 'ring-green-200' 
                      : 'ring-red-200'
                  }`} title={
                    netsuiteStatus.loading 
                      ? '檢查中...' 
                      : netsuiteStatus.connected 
                        ? '已連線' 
                        : '未連線'
                  } />
                </div>
              </div>
              
              {/* 公司名稱顯示 */}
              {netsuiteStatus.connected && netsuiteStatus.companyName && (
                <div className="mb-3">
                  <p className={`text-base font-semibold ${
                    netsuiteStatus.connected ? 'text-blue-900 dark:text-blue-200' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {netsuiteStatus.companyName}
                  </p>
                </div>
              )}
              
              <p className={`text-sm ${
                netsuiteStatus.connected ? 'text-gray-700' : 'text-gray-500'
              }`}>
                {netsuiteStatus.message}
              </p>
            </div>
          </div>
        </div>
    </div>
  )
}

