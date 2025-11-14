'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Cog,
  Plus,
  Edit,
  Trash2,
  Play,
} from 'lucide-react'

interface Workflow {
  id: string
  name: string
  mappingCount: number
  createdAt: string
  updatedAt: string
}

export default function WorkflowsPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'wf_m_live',
      mappingCount: 2,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
    },
  ])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newWorkflowName, setNewWorkflowName] = useState('')

  const handleCreate = () => {
    if (!newWorkflowName.trim()) return

    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: newWorkflowName,
      mappingCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }

    setWorkflows([...workflows, newWorkflow])
    setIsCreateDialogOpen(false)
    setNewWorkflowName('')
    
    // 導航到設計器頁面
    router.push(`/dashboard/etl/workflows/${newWorkflow.id}`)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">工作流管理器</h1>
          <p className="text-muted-foreground mt-1">
            編排和配置 Mappings 為可執行的工作流
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新增工作流
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增工作流</DialogTitle>
              <DialogDescription>
                為您的工作流命名，稍後可以在設計器中配置 Sessions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">工作流名稱</label>
                <Input
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="例如：wf_m_live"
                  className="mt-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreate()
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate}>建立</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>工作流列表</CardTitle>
          <CardDescription>
            所有已建立的工作流，點擊進入設計器進行編輯
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名稱</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>建立時間</TableHead>
                <TableHead>最後更新</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell className="font-medium">{workflow.name}</TableCell>
                  <TableCell>{workflow.mappingCount}</TableCell>
                  <TableCell>{workflow.createdAt}</TableCell>
                  <TableCell>{workflow.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/dashboard/etl/workflows/${workflow.id}`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

