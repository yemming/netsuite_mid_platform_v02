'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Database,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Field {
  name: string
  type: string
}

interface DataTarget {
  id: string
  name: string
  type: 'db' | 'csv'
  targetType: 'new_table' | 'existing_table' | 'csv_file'
  fields: Field[]
  createdAt: string
}

export default function TargetsPage() {
  const [targets, setTargets] = useState<DataTarget[]>([
    {
      id: '1',
      name: 'tgt_final',
      type: 'db',
      targetType: 'new_table',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'customer_name', type: 'varchar' },
        { name: 'total_amount', type: 'decimal' },
        { name: 'created_at', type: 'timestamp' },
      ],
      createdAt: '2024-01-15',
    },
  ])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<DataTarget | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'db' as 'db' | 'csv',
    targetType: 'new_table' as 'new_table' | 'existing_table' | 'csv_file',
    fields: [] as Field[],
  })
  const [newField, setNewField] = useState({ name: '', type: 'varchar' })

  const handleAddField = () => {
    if (newField.name.trim()) {
      setFormData({
        ...formData,
        fields: [...formData.fields, { ...newField }],
      })
      setNewField({ name: '', type: 'varchar' })
    }
  }

  const handleRemoveField = (index: number) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = () => {
    const target: DataTarget = {
      id: editingTarget?.id || `tgt-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      targetType: formData.targetType,
      fields: formData.fields,
      createdAt: editingTarget?.createdAt || new Date().toISOString().split('T')[0],
    }

    if (editingTarget) {
      setTargets(targets.map(t => (t.id === editingTarget.id ? target : t)))
    } else {
      setTargets([...targets, target])
    }

    setIsCreateDialogOpen(false)
    setEditingTarget(null)
    setFormData({
      name: '',
      type: 'db',
      targetType: 'new_table',
      fields: [],
    })
  }

  const openEditDialog = (target: DataTarget) => {
    setEditingTarget(target)
    setFormData({
      name: target.name,
      type: target.type,
      targetType: target.targetType,
      fields: target.fields,
    })
    setIsCreateDialogOpen(true)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">數據目標設計</h1>
          <p className="text-muted-foreground mt-1">
            定義數據目標的結構和屬性
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTarget(null)
              setFormData({
                name: '',
                type: 'db',
                targetType: 'new_table',
                fields: [],
              })
            }}>
              <Plus className="w-4 h-4 mr-2" />
              新增數據目標
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTarget ? '編輯數據目標' : '新增數據目標'}
              </DialogTitle>
              <DialogDescription>
                定義目標的欄位名稱、數據類型和目標類型
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>目標名稱</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：tgt_final"
                  />
                </div>
                <div>
                  <Label>目標類型</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'db' | 'csv') => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="db">資料庫</SelectItem>
                      <SelectItem value="csv">CSV 文件</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>目標方式</Label>
                <Select
                  value={formData.targetType}
                  onValueChange={(value: 'new_table' | 'existing_table' | 'csv_file') =>
                    setFormData({ ...formData, targetType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.type === 'db' ? (
                      <>
                        <SelectItem value="new_table">新建資料表</SelectItem>
                        <SelectItem value="existing_table">現有資料表</SelectItem>
                      </>
                    ) : (
                      <SelectItem value="csv_file">CSV 文件</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <Label className="text-base font-semibold">欄位定義</Label>
                <div className="mt-2 space-y-2">
                  {formData.fields.map((field, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-accent rounded-md">
                      <span className="flex-1 font-medium">{field.name}</span>
                      <Badge variant="secondary">{field.type}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveField(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="欄位名稱"
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddField()
                      }
                    }}
                  />
                  <Select
                    value={newField.type}
                    onValueChange={(value) => setNewField({ ...newField, type: value })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="integer">Integer</SelectItem>
                      <SelectItem value="varchar">Varchar</SelectItem>
                      <SelectItem value="decimal">Decimal</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="timestamp">Timestamp</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddField}>新增欄位</Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSubmit}>
                  {editingTarget ? '更新' : '建立'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>已定義的數據目標</CardTitle>
          <CardDescription>
            管理所有已定義的數據目標
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名稱</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>目標方式</TableHead>
                <TableHead>欄位數</TableHead>
                <TableHead>建立時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.map((target) => (
                <TableRow key={target.id}>
                  <TableCell className="font-medium">{target.name}</TableCell>
                  <TableCell>
                    <Badge variant={target.type === 'db' ? 'default' : 'secondary'}>
                      {target.type === 'db' ? '資料庫' : 'CSV'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {target.targetType === 'new_table' && '新建資料表'}
                    {target.targetType === 'existing_table' && '現有資料表'}
                    {target.targetType === 'csv_file' && 'CSV 文件'}
                  </TableCell>
                  <TableCell>{target.fields.length}</TableCell>
                  <TableCell>{target.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(target)}
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

