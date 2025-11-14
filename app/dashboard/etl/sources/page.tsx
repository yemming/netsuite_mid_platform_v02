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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
  Database,
  FileText,
  Plus,
  Upload,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface DataSource {
  id: string
  name: string
  type: 'db' | 'csv'
  connectionName?: string
  tableName?: string
  fileName?: string
  schema: Array<{
    name: string
    type: string
  }>
  createdAt: string
}

export default function SourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([
    {
      id: '1',
      name: 'src_customer',
      type: 'db',
      connectionName: 'PostgreSQL Production',
      tableName: 'customers',
      schema: [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'varchar' },
        { name: 'email', type: 'varchar' },
        { name: 'created_at', type: 'timestamp' },
      ],
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'src_orders',
      type: 'csv',
      fileName: 'orders_2024.csv',
      schema: [
        { name: 'order_id', type: 'varchar' },
        { name: 'customer_id', type: 'integer' },
        { name: 'amount', type: 'decimal' },
        { name: 'order_date', type: 'date' },
      ],
      createdAt: '2024-01-16',
    },
  ])

  const [isDbDialogOpen, setIsDbDialogOpen] = useState(false)
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)

  // 資料庫連接表單狀態
  const [dbForm, setDbForm] = useState({
    name: '',
    connectionName: '',
    host: '',
    port: '5432',
    database: '',
    username: '',
    password: '',
    dbType: 'postgres',
  })

  // 文件上傳狀態
  const [fileForm, setFileForm] = useState({
    name: '',
    file: null as File | null,
    delimiter: ',',
    hasHeader: true,
  })

  const handleDbSubmit = () => {
    // 模擬連接成功後選擇表
    const newSource: DataSource = {
      id: `src-${Date.now()}`,
      name: dbForm.name || 'src_new',
      type: 'db',
      connectionName: dbForm.connectionName,
      tableName: 'selected_table', // 實際應該從選擇的表單中獲取
      schema: [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'varchar' },
      ],
      createdAt: new Date().toISOString().split('T')[0],
    }
    setSources([...sources, newSource])
    setIsDbDialogOpen(false)
    setDbForm({
      name: '',
      connectionName: '',
      host: '',
      port: '5432',
      database: '',
      username: '',
      password: '',
      dbType: 'postgres',
    })
  }

  const handleFileSubmit = () => {
    if (!fileForm.file) return

    // 模擬解析文件標頭
    const newSource: DataSource = {
      id: `src-${Date.now()}`,
      name: fileForm.name || fileForm.file.name,
      type: 'csv',
      fileName: fileForm.file.name,
      schema: [
        { name: 'column1', type: 'varchar' },
        { name: 'column2', type: 'varchar' },
      ],
      createdAt: new Date().toISOString().split('T')[0],
    }
    setSources([...sources, newSource])
    setIsFileDialogOpen(false)
    setFileForm({
      name: '',
      file: null,
      delimiter: ',',
      hasHeader: true,
    })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">數據源管理</h1>
          <p className="text-muted-foreground mt-1">
            從資料庫或文件導入數據源，定義數據結構
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDbDialogOpen} onOpenChange={setIsDbDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Database className="w-4 h-4 mr-2" />
                從資料庫導入
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>從資料庫導入數據源</DialogTitle>
                <DialogDescription>
                  連接資料庫並選擇要作為數據源的資料表
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>數據源名稱</Label>
                    <Input
                      value={dbForm.name}
                      onChange={(e) => setDbForm({ ...dbForm, name: e.target.value })}
                      placeholder="例如：src_customer"
                    />
                  </div>
                  <div>
                    <Label>連接名稱</Label>
                    <Input
                      value={dbForm.connectionName}
                      onChange={(e) => setDbForm({ ...dbForm, connectionName: e.target.value })}
                      placeholder="例如：PostgreSQL Production"
                    />
                  </div>
                </div>

                <div>
                  <Label>資料庫類型</Label>
                  <Select
                    value={dbForm.dbType}
                    onValueChange={(value) => setDbForm({ ...dbForm, dbType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgres">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="mssql">SQL Server</SelectItem>
                      <SelectItem value="oracle">Oracle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>主機</Label>
                    <Input
                      value={dbForm.host}
                      onChange={(e) => setDbForm({ ...dbForm, host: e.target.value })}
                      placeholder="localhost"
                    />
                  </div>
                  <div>
                    <Label>埠號</Label>
                    <Input
                      value={dbForm.port}
                      onChange={(e) => setDbForm({ ...dbForm, port: e.target.value })}
                      placeholder="5432"
                    />
                  </div>
                </div>

                <div>
                  <Label>資料庫名稱</Label>
                  <Input
                    value={dbForm.database}
                    onChange={(e) => setDbForm({ ...dbForm, database: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>使用者名稱</Label>
                    <Input
                      value={dbForm.username}
                      onChange={(e) => setDbForm({ ...dbForm, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>密碼</Label>
                    <Input
                      type="password"
                      value={dbForm.password}
                      onChange={(e) => setDbForm({ ...dbForm, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDbDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleDbSubmit}>測試連接</Button>
                  <Button onClick={handleDbSubmit}>選擇資料表</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                從文件導入
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>從文件導入數據源</DialogTitle>
                <DialogDescription>
                  上傳 CSV 或 JSON 檔案，系統將自動解析結構
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>數據源名稱</Label>
                  <Input
                    value={fileForm.name}
                    onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })}
                    placeholder="例如：src_orders"
                  />
                </div>

                <div>
                  <Label>選擇檔案</Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept=".csv,.json"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setFileForm({ ...fileForm, file, name: fileForm.name || file.name })
                        }
                      }}
                    />
                  </div>
                  {fileForm.file && (
                    <p className="text-sm text-muted-foreground mt-2">
                      已選擇：{fileForm.file.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>分隔符</Label>
                    <Input
                      value={fileForm.delimiter}
                      onChange={(e) => setFileForm({ ...fileForm, delimiter: e.target.value })}
                      placeholder=","
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="hasHeader"
                        checked={fileForm.hasHeader}
                        onChange={(e) => setFileForm({ ...fileForm, hasHeader: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="hasHeader" className="cursor-pointer">
                        包含標頭行
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsFileDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleFileSubmit}>解析並導入</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>已定義的數據源</CardTitle>
          <CardDescription>
            管理所有已導入的數據源，查看結構和屬性
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名稱</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>來源</TableHead>
                <TableHead>欄位數</TableHead>
                <TableHead>建立時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>
                    <Badge variant={source.type === 'db' ? 'default' : 'secondary'}>
                      {source.type === 'db' ? '資料庫' : '文件'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {source.type === 'db' ? (
                      <span className="text-sm text-muted-foreground">
                        {source.connectionName} / {source.tableName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {source.fileName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{source.schema.length}</TableCell>
                  <TableCell>{source.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
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

