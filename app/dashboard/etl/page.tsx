'use client'

import { useState } from 'react'
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
  Folder,
  FolderOpen,
  Database,
  FileText,
  Share2,
  Cog,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// 模擬資料結構
interface Folder {
  id: string
  name: string
  parentId: string | null
  children?: Folder[]
  sources?: DataSource[]
  targets?: DataTarget[]
  mappings?: Mapping[]
  workflows?: Workflow[]
}

interface DataSource {
  id: string
  name: string
  type: 'db' | 'csv'
  folderId: string
}

interface DataTarget {
  id: string
  name: string
  type: 'db' | 'csv'
  folderId: string
}

interface Mapping {
  id: string
  name: string
  folderId: string
  isValid: boolean
}

interface Workflow {
  id: string
  name: string
  folderId: string
}

export default function RepositoryPage() {
  const [folders, setFolders] = useState<Folder[]>([
    {
      id: '1',
      name: '我的專案',
      parentId: null,
      sources: [
        { id: 's1', name: 'src_customer', type: 'db', folderId: '1' },
        { id: 's2', name: 'src_orders', type: 'csv', folderId: '1' },
      ],
      targets: [
        { id: 't1', name: 'tgt_final', type: 'db', folderId: '1' },
      ],
      mappings: [
        { id: 'm1', name: 'm_live', folderId: '1', isValid: true },
      ],
      workflows: [
        { id: 'w1', name: 'wf_m_live', folderId: '1' },
      ],
    },
  ])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1']))
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const createFolder = () => {
    if (!newFolderName.trim()) return

    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      parentId: selectedFolder,
      sources: [],
      targets: [],
      mappings: [],
      workflows: [],
    }

    if (selectedFolder) {
      // 添加到選中的資料夾下
      const updateFolders = (folders: Folder[]): Folder[] => {
        return folders.map(folder => {
          if (folder.id === selectedFolder) {
            return {
              ...folder,
              children: [...(folder.children || []), newFolder],
            }
          }
          if (folder.children) {
            return { ...folder, children: updateFolders(folder.children) }
          }
          return folder
        })
      }
      setFolders(updateFolders(folders))
    } else {
      // 添加到根目錄
      setFolders([...folders, newFolder])
    }

    setNewFolderName('')
    setIsCreateDialogOpen(false)
    setSelectedFolder(null)
  }

  const renderFolder = (folder: Folder, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const indent = level * 20

    return (
      <div key={folder.id} className="select-none">
        <div
          className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md cursor-pointer group"
          style={{ paddingLeft: `${12 + indent}px` }}
        >
          <button
            onClick={() => toggleFolder(folder.id)}
            className="p-0.5 hover:bg-accent rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-blue-500" />
          ) : (
            <Folder className="w-4 h-4 text-blue-500" />
          )}
          <span className="flex-1 text-sm font-medium">{folder.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedFolder(folder.id)}>
                <Plus className="w-4 h-4 mr-2" />
                新增子資料夾
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                重新命名
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                刪除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isExpanded && (
          <div className="ml-4">
            {/* 子資料夾 */}
            {folder.children?.map(child => renderFolder(child, level + 1))}

            {/* 數據源 */}
            {folder.sources && folder.sources.length > 0 && (
              <div className="ml-6 mt-1">
                {folder.sources.map(source => (
                  <div
                    key={source.id}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent rounded-md text-sm text-muted-foreground"
                  >
                    <Database className="w-4 h-4" />
                    <span>{source.name}</span>
                    <span className="text-xs ml-auto">({source.type})</span>
                  </div>
                ))}
              </div>
            )}

            {/* 數據目標 */}
            {folder.targets && folder.targets.length > 0 && (
              <div className="ml-6 mt-1">
                {folder.targets.map(target => (
                  <div
                    key={target.id}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent rounded-md text-sm text-muted-foreground"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{target.name}</span>
                    <span className="text-xs ml-auto">({target.type})</span>
                  </div>
                ))}
              </div>
            )}

            {/* 映射 */}
            {folder.mappings && folder.mappings.length > 0 && (
              <div className="ml-6 mt-1">
                {folder.mappings.map(mapping => (
                  <div
                    key={mapping.id}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent rounded-md text-sm text-muted-foreground"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{mapping.name}</span>
                    {mapping.isValid && (
                      <span className="text-xs ml-auto text-green-500">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 工作流 */}
            {folder.workflows && folder.workflows.length > 0 && (
              <div className="ml-6 mt-1">
                {folder.workflows.map(workflow => (
                  <div
                    key={workflow.id}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent rounded-md text-sm text-muted-foreground"
                  >
                    <Cog className="w-4 h-4" />
                    <span>{workflow.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">倉庫管理器</h1>
          <p className="text-muted-foreground mt-1">
            組織和管理您的 ETL 專案資產
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedFolder(null)}>
              <Plus className="w-4 h-4 mr-2" />
              新增資料夾
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增資料夾</DialogTitle>
              <DialogDescription>
                為您的 ETL 專案創建一個新的資料夾來組織資產
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">資料夾名稱</label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="例如：客戶資料整合專案"
                  className="mt-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      createFolder()
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setNewFolderName('')
                  }}
                >
                  取消
                </Button>
                <Button onClick={createFolder}>建立</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>專案結構</CardTitle>
          <CardDescription>
            樹狀結構顯示所有資料夾及其包含的 Sources、Targets、Mappings 和 Workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[400px] border rounded-lg p-4">
            {folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground">
                <Folder className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">尚無資料夾</p>
                <p className="text-sm">點擊「新增資料夾」開始建立您的專案結構</p>
              </div>
            ) : (
              <div className="space-y-1">
                {folders.map(folder => renderFolder(folder))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">數據源</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {folders.reduce((acc, f) => acc + (f.sources?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">已定義的數據源</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">數據目標</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {folders.reduce((acc, f) => acc + (f.targets?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">已定義的數據目標</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">映射</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {folders.reduce((acc, f) => acc + (f.mappings?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">已建立的映射</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">工作流</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {folders.reduce((acc, f) => acc + (f.workflows?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">已配置的工作流</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

