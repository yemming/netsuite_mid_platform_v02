'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Save,
  Play,
  Cog,
  Share2,
} from 'lucide-react'

// 自定義節點類型
const StartNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 bg-green-50 dark:bg-green-950 border-2 border-green-500 rounded-lg shadow-md min-w-[120px]">
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-2">
        <Play className="w-4 h-4 text-green-600" />
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
    </div>
  )
}

const SessionNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950 border-2 border-blue-500 rounded-lg shadow-md min-w-[180px]">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-2">
        <Cog className="w-4 h-4 text-blue-600" />
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {data.mappingName || '未配置'}
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  start: StartNode,
  session: SessionNode,
}

export default function WorkflowDesignerPage() {
  const params = useParams()
  const router = useRouter()
  const workflowId = params.id as string

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: 'start-1',
      type: 'start',
      position: { x: 100, y: 200 },
      data: { label: 'Start' },
    },
    {
      id: 'session-1',
      type: 'session',
      position: { x: 300, y: 200 },
      data: { label: 'Session 1', mappingName: 'm_live' },
    },
  ])

  const [edges, setEdges, onEdgesChange] = useEdgesState([
    { id: 'e1', source: 'start-1', target: 'session-1' },
  ])

  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [sessionConfig, setSessionConfig] = useState({
    mappingId: '',
    sourceConnection: '',
    targetConnection: '',
    sourceFilePath: '',
    targetFilePath: '',
    includeHeader: true,
  })

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const addSession = () => {
    const newNode: Node = {
      id: `session-${Date.now()}`,
      type: 'session',
      position: { x: 400, y: 200 },
      data: { label: 'Session', mappingName: '未配置' },
    }
    setNodes((nds) => [...nds, newNode])
    setSelectedNode(newNode)
    setIsSessionDialogOpen(true)
  }

  const handleNodeDoubleClick = (event: React.MouseEvent, node: Node) => {
    if (node.type === 'session') {
      setSelectedNode(node)
      setIsSessionDialogOpen(true)
    }
  }

  const handleSaveSession = () => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? {
                ...node,
                data: {
                  ...node.data,
                  mappingName: sessionConfig.mappingId || '未配置',
                },
              }
            : node
        )
      )
    }
    setIsSessionDialogOpen(false)
  }

  const handleExecute = () => {
    // 模擬執行工作流
    console.log('Executing workflow:', workflowId)
    alert('工作流執行已啟動（模擬）')
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 工具列 */}
      <div className="border-b bg-background p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">工作流設計器</h1>
            <p className="text-sm text-muted-foreground">編排 Sessions 為可執行的工作流</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={addSession}>
            <Cog className="w-4 h-4 mr-2" />
            新增 Session
          </Button>
          <Button variant="outline" onClick={() => {}}>
            <Save className="w-4 h-4 mr-2" />
            儲存
          </Button>
          <Button onClick={handleExecute}>
            <Play className="w-4 h-4 mr-2" />
            執行工作流
          </Button>
        </div>
      </div>

      {/* 主內容區 */}
      <div className="flex-1 flex">
        {/* 左側面板 - 組件庫 */}
        <div className="w-64 border-r bg-muted/50 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">組件庫</h3>
          <div className="space-y-2">
            <div className="p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                <span className="text-sm font-medium">Start</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">工作流起始點</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-2">
                <Cog className="w-4 h-4" />
                <span className="text-sm font-medium">Session</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">執行映射的 Session</p>
            </div>
          </div>
        </div>

        {/* 中間 - React Flow 畫布 */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={handleNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* 右側面板 - 屬性 */}
        <div className="w-80 border-l bg-muted/50 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">屬性</h3>
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <Label>節點名稱</Label>
                <Input value={selectedNode.data.label} readOnly />
              </div>
              <div>
                <Label>關聯映射</Label>
                <Input value={selectedNode.data.mappingName || ''} readOnly />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">選擇一個節點查看屬性</p>
          )}
        </div>
      </div>

      {/* Session 配置對話框 */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>配置 Session</DialogTitle>
            <DialogDescription>
              關聯映射並配置數據源和目標的連接資訊
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>關聯映射</Label>
              <Select
                value={sessionConfig.mappingId}
                onValueChange={(value) => setSessionConfig({ ...sessionConfig, mappingId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇一個映射" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m_live">m_live</SelectItem>
                  <SelectItem value="m_customer_orders">m_customer_orders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">數據源配置</h4>
              <div className="space-y-3">
                <div>
                  <Label>資料庫連接（資料庫源）</Label>
                  <Select
                    value={sessionConfig.sourceConnection}
                    onValueChange={(value) =>
                      setSessionConfig({ ...sessionConfig, sourceConnection: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇連接" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pg_prod">PostgreSQL Production</SelectItem>
                      <SelectItem value="mysql_dev">MySQL Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>文件路徑（文件源）</Label>
                  <Input
                    value={sessionConfig.sourceFilePath}
                    onChange={(e) =>
                      setSessionConfig({ ...sessionConfig, sourceFilePath: e.target.value })
                    }
                    placeholder="/path/to/source.csv"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">數據目標配置</h4>
              <div className="space-y-3">
                <div>
                  <Label>資料庫連接（資料庫目標）</Label>
                  <Select
                    value={sessionConfig.targetConnection}
                    onValueChange={(value) =>
                      setSessionConfig({ ...sessionConfig, targetConnection: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇連接" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pg_prod">PostgreSQL Production</SelectItem>
                      <SelectItem value="mysql_dev">MySQL Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>目標文件路徑（文件目標）</Label>
                  <Input
                    value={sessionConfig.targetFilePath}
                    onChange={(e) =>
                      setSessionConfig({ ...sessionConfig, targetFilePath: e.target.value })
                    }
                    placeholder="/path/to/target.csv"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeHeader"
                    checked={sessionConfig.includeHeader}
                    onChange={(e) =>
                      setSessionConfig({ ...sessionConfig, includeHeader: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="includeHeader" className="cursor-pointer">
                    包含標頭（Output field names）
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsSessionDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSaveSession}>確定</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

