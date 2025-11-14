'use client'

import { useState, useCallback, useRef } from 'react'
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

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Database,
  FileText,
  Share2,
  GitBranch,
  Code,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// 自定義節點類型
const SourceNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950 border-2 border-blue-500 rounded-lg shadow-md min-w-[150px]">
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-blue-600" />
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{data.type}</div>
    </div>
  )
}

const SourceQualifierNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 bg-green-50 dark:bg-green-950 border-2 border-green-500 rounded-lg shadow-md min-w-[150px]">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-2">
        <Code className="w-4 h-4 text-green-600" />
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
    </div>
  )
}

const JoinerNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 bg-purple-50 dark:bg-purple-950 border-2 border-purple-500 rounded-lg shadow-md min-w-[150px]">
      <Handle type="target" position={Position.Left} id="input1" />
      <Handle type="target" position={Position.Left} id="input2" style={{ top: '60%' }} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-purple-600" />
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{data.joinType || 'Inner'}</div>
    </div>
  )
}

const AggregatorNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 bg-orange-50 dark:bg-orange-950 border-2 border-orange-500 rounded-lg shadow-md min-w-[150px]">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-2">
        <Code className="w-4 h-4 text-orange-600" />
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
    </div>
  )
}

const TargetNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 bg-red-50 dark:bg-red-950 border-2 border-red-500 rounded-lg shadow-md min-w-[150px]">
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-red-600" />
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{data.type}</div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  source: SourceNode,
  sourceQualifier: SourceQualifierNode,
  joiner: JoinerNode,
  aggregator: AggregatorNode,
  target: TargetNode,
}

export default function MappingDesignerPage() {
  const params = useParams()
  const router = useRouter()
  const mappingId = params.id as string

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: '1',
      type: 'source',
      position: { x: 100, y: 100 },
      data: { label: 'src_customer', type: 'db' },
    },
    {
      id: '2',
      type: 'sourceQualifier',
      position: { x: 300, y: 100 },
      data: { label: 'SQ_customer' },
    },
    {
      id: '3',
      type: 'target',
      position: { x: 500, y: 100 },
      data: { label: 'tgt_final', type: 'db' },
    },
  ])

  const [edges, setEdges, onEdgesChange] = useEdgesState([
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
  ])

  const [isJoinerDialogOpen, setIsJoinerDialogOpen] = useState(false)
  const [isAggregatorDialogOpen, setIsAggregatorDialogOpen] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | null>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const addJoiner = () => {
    const newNode: Node = {
      id: `joiner-${Date.now()}`,
      type: 'joiner',
      position: { x: 400, y: 200 },
      data: { label: 'Joiner', joinType: 'Inner' },
    }
    setNodes((nds) => [...nds, newNode])
    setIsJoinerDialogOpen(false)
  }

  const addAggregator = () => {
    const newNode: Node = {
      id: `aggregator-${Date.now()}`,
      type: 'aggregator',
      position: { x: 400, y: 300 },
      data: { label: 'Aggregator' },
    }
    setNodes((nds) => [...nds, newNode])
    setIsAggregatorDialogOpen(false)
  }

  const handleNodeDoubleClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    if (node.type === 'joiner') {
      setIsJoinerDialogOpen(true)
    } else if (node.type === 'aggregator') {
      setIsAggregatorDialogOpen(true)
    }
  }

  const handleSave = () => {
    // 模擬驗證
    const isValid = nodes.length > 0 && edges.length > 0
    setValidationStatus(isValid ? 'valid' : 'invalid')
    
    // 實際應該將 nodes 和 edges 序列化為 JSON 並保存到後端
    const definition = {
      nodes,
      edges,
    }
    console.log('Saving mapping:', definition)
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
            <h1 className="text-2xl font-bold">映射設計器</h1>
            <p className="text-sm text-muted-foreground">設計數據轉換映射</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={addJoiner}>
            <GitBranch className="w-4 h-4 mr-2" />
            新增 Joiner
          </Button>
          <Button variant="outline" onClick={addAggregator}>
            <Code className="w-4 h-4 mr-2" />
            新增 Aggregator
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            儲存 (Ctrl+S)
          </Button>
        </div>
      </div>

      {/* 主內容區 */}
      <div className="flex-1 flex">
        {/* 左側面板 - 組件庫 */}
        <div className="w-64 border-r bg-muted/50 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">組件庫</h3>
          <div className="space-y-2">
            <div className="p-3 bg-background rounded-lg border cursor-move">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="text-sm font-medium">數據源</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">從倉庫拖放</p>
            </div>
            <div className="p-3 bg-background rounded-lg border cursor-move">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">數據目標</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">從倉庫拖放</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span className="text-sm font-medium">Joiner</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">連接多個數據源</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="text-sm font-medium">Aggregator</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">聚合計算</p>
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
                <Label>節點類型</Label>
                <Input value={selectedNode.type || ''} readOnly />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">選擇一個節點查看屬性</p>
          )}
        </div>
      </div>

      {/* 底部狀態列 */}
      <div className="border-t bg-background p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {validationStatus === 'valid' && (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500">Mapping is valid</span>
            </>
          )}
          {validationStatus === 'invalid' && (
            <>
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-500">Mapping has errors</span>
            </>
          )}
          {validationStatus === null && (
            <span className="text-sm text-muted-foreground">未驗證</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          節點: {nodes.length} | 連接: {edges.length}
        </div>
      </div>

      {/* Joiner 配置對話框 */}
      <Dialog open={isJoinerDialogOpen} onOpenChange={setIsJoinerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>配置 Joiner</DialogTitle>
            <DialogDescription>設定連接類型和條件</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>連接類型</Label>
              <Select defaultValue="inner">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inner">Inner Join</SelectItem>
                  <SelectItem value="left">Left Join</SelectItem>
                  <SelectItem value="right">Right Join</SelectItem>
                  <SelectItem value="full">Full Join</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>連接條件</Label>
              <Input placeholder="例如：src1.product_id = src2.product_id" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsJoinerDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={() => setIsJoinerDialogOpen(false)}>確定</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Aggregator 配置對話框 */}
      <Dialog open={isAggregatorDialogOpen} onOpenChange={setIsAggregatorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>配置 Aggregator</DialogTitle>
            <DialogDescription>設定分組欄位和聚合函數</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Group By 欄位</Label>
              <Input placeholder="選擇要分組的欄位" />
            </div>
            <div>
              <Label>聚合函數</Label>
              <Select defaultValue="sum">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">SUM</SelectItem>
                  <SelectItem value="count">COUNT</SelectItem>
                  <SelectItem value="avg">AVG</SelectItem>
                  <SelectItem value="max">MAX</SelectItem>
                  <SelectItem value="min">MIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAggregatorDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={() => setIsAggregatorDialogOpen(false)}>確定</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

