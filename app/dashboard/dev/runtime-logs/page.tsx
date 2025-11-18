'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Download, Trash2, RefreshCw, Copy, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  details?: string
}

export default function RuntimeLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const endOfLogsRef = useRef<HTMLDivElement>(null)

  // 獲取日誌
  const fetchLogs = async (since?: string) => {
    try {
      const url = since 
        ? `/api/dev/runtime-logs?since=${since}&limit=500`
        : `/api/dev/runtime-logs?limit=500`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.logs) {
        if (since) {
          // 增量更新：只添加新日誌
          setLogs(prev => {
            const existingIds = new Set(prev.map(log => log.id))
            const newLogs = data.logs.filter((log: LogEntry) => !existingIds.has(log.id))
            return [...prev, ...newLogs].slice(-500) // 最多保留 500 條
          })
        } else {
          // 全量更新
          setLogs(data.logs)
        }
        setLastFetchTime(data.timestamp)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 初始載入
  useEffect(() => {
    fetchLogs()
  }, [])

  // 自動刷新
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchLogs(lastFetchTime || undefined)
    }, 2000) // 每 2 秒刷新一次

    return () => clearInterval(interval)
  }, [autoRefresh, lastFetchTime])

  // 自動滾動到底部
  useEffect(() => {
    if (endOfLogsRef.current && autoRefresh) {
      endOfLogsRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoRefresh])

  // 清除日誌
  const handleClear = async () => {
    try {
      await fetch('/api/dev/runtime-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      })
      setLogs([])
      setLastFetchTime(null)
    } catch (error) {
      console.error('Failed to clear logs:', error)
    }
  }

  // 下載日誌
  const handleDownload = () => {
    const logText = logs.map(log => 
      `[${new Date(log.timestamp).toLocaleString('zh-TW')}] [${log.level.toUpperCase()}] ${log.message}${log.details ? '\n' + log.details : ''}`
    ).join('\n\n')
    
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `runtime-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 複製單條日誌
  const handleCopyLog = async (log: LogEntry) => {
    const logText = `[${new Date(log.timestamp).toLocaleString('zh-TW')}] [${log.level.toUpperCase()}] ${log.message}${log.details ? '\n' + log.details : ''}`
    await navigator.clipboard.writeText(logText)
    setCopiedId(log.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 格式化時間
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  // 獲取日誌級別樣式
  const getLogLevelStyle = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500 dark:text-red-400'
      case 'warn':
        return 'text-yellow-500 dark:text-yellow-400'
      case 'success':
        return 'text-green-500 dark:text-green-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  // 獲取日誌級別圖標
  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return '🔴'
      case 'warn':
        return '⚠️'
      case 'success':
        return '✅'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Runtime Logs</h1>
          <p className="text-muted-foreground mt-1">
            本地開發服務器運行時日誌
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-primary/10' : ''}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", autoRefresh && "animate-spin")} />
            {autoRefresh ? '自動刷新中' : '手動刷新'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            刷新
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            下載
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={logs.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            清除
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>服務器日誌</CardTitle>
          <CardDescription>
            共 {logs.length} 條日誌 {autoRefresh && '• 自動刷新中'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-280px)]" ref={scrollAreaRef}>
            <div className="space-y-1 font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暫無日誌
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      "group flex items-start gap-3 p-2 rounded hover:bg-accent/50 transition-colors",
                      log.level === 'error' && "bg-red-50/50 dark:bg-red-950/20",
                      log.level === 'warn' && "bg-yellow-50/50 dark:bg-yellow-950/20"
                    )}
                  >
                    <span className="text-xs text-muted-foreground min-w-[140px]">
                      {formatTime(log.timestamp)}
                    </span>
                    <span className={cn("min-w-[60px]", getLogLevelStyle(log.level))}>
                      {getLogLevelIcon(log.level)} {log.level.toUpperCase()}
                    </span>
                    <span className="flex-1 break-words">{log.message}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      onClick={() => handleCopyLog(log)}
                    >
                      {copiedId === log.id ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))
              )}
              <div ref={endOfLogsRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

