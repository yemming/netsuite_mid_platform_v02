'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BarChart3,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ExecutionLog {
  id: string
  workflowName: string
  status: 'running' | 'succeeded' | 'failed'
  startTime: string
  endTime?: string
  duration?: number
  runBy: string
  statistics?: {
    sources: Array<{ name: string; rows: number }>
    targets: Array<{ name: string; rows: number }>
  }
  errorMessage?: string
}

export default function MonitorPage() {
  const [executions, setExecutions] = useState<ExecutionLog[]>([
    {
      id: '1',
      workflowName: 'wf_m_live',
      status: 'succeeded',
      startTime: '2024-01-20 10:30:00',
      endTime: '2024-01-20 10:35:23',
      duration: 323,
      runBy: 'admin@example.com',
      statistics: {
        sources: [
          { name: 'SQ_customer', rows: 10000 },
          { name: 'SQ_orders', rows: 5000 },
        ],
        targets: [
          { name: 'TGT_final', rows: 9945 },
        ],
      },
    },
    {
      id: '2',
      workflowName: 'wf_customer_orders',
      status: 'running',
      startTime: '2024-01-20 11:00:00',
      runBy: 'admin@example.com',
    },
    {
      id: '3',
      workflowName: 'wf_m_live',
      status: 'failed',
      startTime: '2024-01-20 09:15:00',
      endTime: '2024-01-20 09:16:45',
      duration: 105,
      runBy: 'admin@example.com',
      errorMessage: 'Connection timeout to database',
    },
  ])

  const [selectedExecution, setSelectedExecution] = useState<ExecutionLog | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            成功
          </Badge>
        )
      case 'running':
        return (
          <Badge className="bg-blue-500">
            <Clock className="w-3 h-3 mr-1" />
            執行中
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            失敗
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleViewDetails = (execution: ExecutionLog) => {
    setSelectedExecution(execution)
    setIsDetailDialogOpen(true)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">工作流監視器</h1>
          <p className="text-muted-foreground mt-1">
            追蹤工作流的執行狀態和日誌
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          重新整理
        </Button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">總執行次數</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">執行中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {executions.filter((e) => e.status === 'running').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">成功</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {executions.filter((e) => e.status === 'succeeded').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">失敗</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {executions.filter((e) => e.status === 'failed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 執行記錄表格 */}
      <Card>
        <CardHeader>
          <CardTitle>執行記錄</CardTitle>
          <CardDescription>
            所有已執行或正在執行的工作流任務
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>工作流名稱</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>開始時間</TableHead>
                <TableHead>結束時間</TableHead>
                <TableHead>執行時間</TableHead>
                <TableHead>執行者</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell className="font-medium">{execution.workflowName}</TableCell>
                  <TableCell>{getStatusBadge(execution.status)}</TableCell>
                  <TableCell>{execution.startTime}</TableCell>
                  <TableCell>{execution.endTime || '-'}</TableCell>
                  <TableCell>{formatDuration(execution.duration)}</TableCell>
                  <TableCell>{execution.runBy}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(execution)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 詳細資訊對話框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>執行詳情</DialogTitle>
            <DialogDescription>
              {selectedExecution?.workflowName} 的執行統計和日誌
            </DialogDescription>
          </DialogHeader>
          {selectedExecution && (
            <div className="space-y-6 py-4">
              {/* 基本資訊 */}
              <div>
                <h3 className="font-semibold mb-3">基本資訊</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">工作流名稱</Label>
                    <p className="font-medium">{selectedExecution.workflowName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">狀態</Label>
                    <div className="mt-1">{getStatusBadge(selectedExecution.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">開始時間</Label>
                    <p className="font-medium">{selectedExecution.startTime}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">結束時間</Label>
                    <p className="font-medium">{selectedExecution.endTime || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">執行時間</Label>
                    <p className="font-medium">{formatDuration(selectedExecution.duration)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">執行者</Label>
                    <p className="font-medium">{selectedExecution.runBy}</p>
                  </div>
                </div>
              </div>

              {/* 錯誤訊息 */}
              {selectedExecution.errorMessage && (
                <div>
                  <h3 className="font-semibold mb-3 text-red-500">錯誤訊息</h3>
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {selectedExecution.errorMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* 統計資訊 */}
              {selectedExecution.statistics && (
                <div>
                  <h3 className="font-semibold mb-3">運行時統計</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">數據源</h4>
                      <div className="space-y-2">
                        {selectedExecution.statistics.sources.map((source, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">{source.name}</span>
                            <Badge variant="secondary">{source.rows.toLocaleString()} rows</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">數據目標</h4>
                      <div className="space-y-2">
                        {selectedExecution.statistics.targets.map((target, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">{target.name}</span>
                            <Badge variant="secondary">{target.rows.toLocaleString()} rows</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

