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
  Share2,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Mapping {
  id: string
  name: string
  isValid: boolean
  createdAt: string
  updatedAt: string
}

export default function MappingsPage() {
  const router = useRouter()
  const [mappings, setMappings] = useState<Mapping[]>([
    {
      id: '1',
      name: 'm_live',
      isValid: true,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
    },
    {
      id: '2',
      name: 'm_customer_orders',
      isValid: false,
      createdAt: '2024-01-16',
      updatedAt: '2024-01-18',
    },
  ])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newMappingName, setNewMappingName] = useState('')

  const handleCreate = () => {
    if (!newMappingName.trim()) return

    const newMapping: Mapping = {
      id: `mapping-${Date.now()}`,
      name: newMappingName,
      isValid: false,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }

    setMappings([...mappings, newMapping])
    setIsCreateDialogOpen(false)
    setNewMappingName('')
    
    // 導航到設計器頁面
    router.push(`/dashboard/etl/mappings/${newMapping.id}`)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">映射設計器</h1>
          <p className="text-muted-foreground mt-1">
            建立和管理數據映射，定義數據轉換邏輯
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新增映射
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增映射</DialogTitle>
              <DialogDescription>
                為您的映射命名，稍後可以在設計器中配置詳細的轉換邏輯
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">映射名稱</label>
                <Input
                  value={newMappingName}
                  onChange={(e) => setNewMappingName(e.target.value)}
                  placeholder="例如：m_live"
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
          <CardTitle>映射列表</CardTitle>
          <CardDescription>
            所有已建立的映射，點擊進入設計器進行編輯
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名稱</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>建立時間</TableHead>
                <TableHead>最後更新</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-medium">{mapping.name}</TableCell>
                  <TableCell>
                    {mapping.isValid ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        有效
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="w-3 h-3 mr-1" />
                        無效
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{mapping.createdAt}</TableCell>
                  <TableCell>{mapping.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/dashboard/etl/mappings/${mapping.id}`)}
                      >
                        <Edit className="w-4 h-4" />
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

