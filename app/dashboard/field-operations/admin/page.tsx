'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Cog, 
  FileText, 
  Package, 
  Truck, 
  Plus, 
  Edit, 
  Trash2,
  ArrowRight,
  Warehouse,
  User
} from 'lucide-react';
import { Case, WorkOrder, InventoryItem, TechnicianStock } from '@/lib/field-operations-types';

export default function AdminPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [technicianStocks, setTechnicianStocks] = useState<TechnicianStock[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isCaseToWorkOrderModalOpen, setIsCaseToWorkOrderModalOpen] = useState(false);
  const [isInventoryTransferModalOpen, setIsInventoryTransferModalOpen] = useState(false);
  const [newWorkOrderPriority, setNewWorkOrderPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [transferFrom, setTransferFrom] = useState<string>('');
  const [transferTo, setTransferTo] = useState<string>('');
  const [transferItemId, setTransferItemId] = useState<string>('');
  const [transferQuantity, setTransferQuantity] = useState<string>('');

  // 模擬資料
  useEffect(() => {
    // TODO: 從 API 載入實際資料
    const mockCases: Case[] = [
      {
        id: 'CASE-001',
        title: '空調系統故障',
        description: '辦公室空調無法運轉，需要緊急維修',
        customerId: 'CUST-001',
        assetId: 'ASSET-001',
        status: 'open',
        createdAt: '2025-01-14T10:00:00',
        updatedAt: '2025-01-14T10:00:00',
      },
      {
        id: 'CASE-002',
        title: '網路設備檢查',
        description: '定期維護檢查',
        customerId: 'CUST-002',
        status: 'open',
        createdAt: '2025-01-13T09:00:00',
        updatedAt: '2025-01-13T09:00:00',
      },
      {
        id: 'CASE-003',
        title: '已完成案件',
        description: '已處理完成的案件',
        customerId: 'CUST-003',
        status: 'closed',
        createdAt: '2025-01-10T08:00:00',
        updatedAt: '2025-01-12T16:00:00',
      },
    ];
    setCases(mockCases);

    const mockInventory: InventoryItem[] = [
      { id: 'ITEM-001', partNumber: 'FILTER-001', name: '空調濾網', description: '標準空調濾網', unitPrice: 500, stockQuantity: 50 },
      { id: 'ITEM-002', partNumber: 'CABLE-001', name: '網路線', description: 'Cat6 網路線', unitPrice: 200, stockQuantity: 100 },
      { id: 'ITEM-003', partNumber: 'FUSE-001', name: '保險絲', description: '標準保險絲', unitPrice: 100, stockQuantity: 200 },
    ];
    setInventoryItems(mockInventory);

    const mockTechnicianStocks: TechnicianStock[] = [
      { id: 'TS-001', technicianId: 'TECH-001', itemId: 'ITEM-001', quantity: 5 },
      { id: 'TS-002', technicianId: 'TECH-001', itemId: 'ITEM-002', quantity: 10 },
      { id: 'TS-003', technicianId: 'TECH-002', itemId: 'ITEM-001', quantity: 3 },
    ];
    setTechnicianStocks(mockTechnicianStocks);
  }, []);

  const handleConvertCaseToWorkOrder = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsCaseToWorkOrderModalOpen(true);
  };

  const handleCreateWorkOrder = () => {
    if (!selectedCase) return;
    // TODO: 呼叫 API 建立工單
    console.log('建立工單:', {
      caseId: selectedCase.id,
      priority: newWorkOrderPriority,
    });
    setIsCaseToWorkOrderModalOpen(false);
    setSelectedCase(null);
  };

  const handleOpenInventoryTransfer = () => {
    setIsInventoryTransferModalOpen(true);
  };

  const handleTransferInventory = () => {
    if (!transferFrom || !transferTo || !transferItemId || !transferQuantity) {
      alert('請填寫所有欄位');
      return;
    }
    // TODO: 呼叫 API 執行庫存轉移
    console.log('庫存轉移:', {
      from: transferFrom,
      to: transferTo,
      itemId: transferItemId,
      quantity: parseInt(transferQuantity),
    });
    setIsInventoryTransferModalOpen(false);
    // 重置表單
    setTransferFrom('');
    setTransferTo('');
    setTransferItemId('');
    setTransferQuantity('');
  };

  const getCaseStatusBadge = (status: Case['status']) => {
    return status === 'open' ? (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">開啟</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">已關閉</Badge>
    );
  };

  const openCases = cases.filter(c => c.status === 'open');
  const closedCases = cases.filter(c => c.status === 'closed');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 標題 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Cog className="h-6 w-6" />
          後勤管理
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          管理案件、庫存與技術人員資源
        </p>
      </div>

      {/* 案件管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            案件管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 開啟的案件 */}
            <div>
              <h3 className="font-semibold mb-2">開啟的案件</h3>
              {openCases.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">目前沒有開啟的案件</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>案件 ID</TableHead>
                      <TableHead>標題</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>建立時間</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openCases.map((caseItem) => (
                      <TableRow key={caseItem.id}>
                        <TableCell className="font-medium">{caseItem.id}</TableCell>
                        <TableCell>{caseItem.title}</TableCell>
                        <TableCell className="max-w-md truncate">{caseItem.description}</TableCell>
                        <TableCell>{getCaseStatusBadge(caseItem.status)}</TableCell>
                        <TableCell>
                          {new Date(caseItem.createdAt).toLocaleString('zh-TW')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleConvertCaseToWorkOrder(caseItem)}
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            轉為工單
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* 已關閉的案件 */}
            <div>
              <h3 className="font-semibold mb-2">已關閉的案件</h3>
              {closedCases.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">目前沒有已關閉的案件</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>案件 ID</TableHead>
                      <TableHead>標題</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>關閉時間</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closedCases.map((caseItem) => (
                      <TableRow key={caseItem.id}>
                        <TableCell className="font-medium">{caseItem.id}</TableCell>
                        <TableCell>{caseItem.title}</TableCell>
                        <TableCell>{getCaseStatusBadge(caseItem.status)}</TableCell>
                        <TableCell>
                          {new Date(caseItem.updatedAt).toLocaleString('zh-TW')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 庫存管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              庫存管理
            </CardTitle>
            <Button onClick={handleOpenInventoryTransfer} size="sm">
              <Truck className="h-4 w-4 mr-2" />
              庫存轉移
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 中央倉庫庫存 */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                中央倉庫
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>零件編號</TableHead>
                    <TableHead>名稱</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>單價</TableHead>
                    <TableHead>庫存數量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.partNumber}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.description || 'N/A'}</TableCell>
                      <TableCell>${item.unitPrice || 0}</TableCell>
                      <TableCell>{item.stockQuantity || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 技術人員庫存 */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                技術人員庫存
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>技術人員 ID</TableHead>
                    <TableHead>零件名稱</TableHead>
                    <TableHead>數量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicianStocks.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">{stock.technicianId}</TableCell>
                      <TableCell>
                        {inventoryItems.find(item => item.id === stock.itemId)?.name || stock.itemId}
                      </TableCell>
                      <TableCell>{stock.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 案件轉工單 Modal */}
      <Dialog open={isCaseToWorkOrderModalOpen} onOpenChange={setIsCaseToWorkOrderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>將案件轉為工單</DialogTitle>
            <DialogDescription>
              為案件 {selectedCase?.id} 建立新的工單
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>案件資訊</Label>
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="font-semibold">{selectedCase?.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedCase?.description}
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="priority">優先級</Label>
              <Select
                value={newWorkOrderPriority}
                onValueChange={(v) => setNewWorkOrderPriority(v as typeof newWorkOrderPriority)}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="urgent">緊急</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCaseToWorkOrderModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateWorkOrder}>
              建立工單
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 庫存轉移 Modal */}
      <Dialog open={isInventoryTransferModalOpen} onOpenChange={setIsInventoryTransferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>庫存轉移</DialogTitle>
            <DialogDescription>
              從中央倉庫轉移零件到技術人員庫存
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="from">來源</Label>
              <Select value={transferFrom} onValueChange={setTransferFrom}>
                <SelectTrigger id="from">
                  <SelectValue placeholder="選擇來源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse">中央倉庫</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="to">目標技術人員</Label>
              <Select value={transferTo} onValueChange={setTransferTo}>
                <SelectTrigger id="to">
                  <SelectValue placeholder="選擇技術人員" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TECH-001">魯夫</SelectItem>
                  <SelectItem value="TECH-002">索隆</SelectItem>
                  <SelectItem value="TECH-003">香吉士</SelectItem>
                  <SelectItem value="TECH-004">佛朗基</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="item">零件</Label>
              <Select value={transferItemId} onValueChange={setTransferItemId}>
                <SelectTrigger id="item">
                  <SelectValue placeholder="選擇零件" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.partNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">數量</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
                placeholder="輸入數量"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInventoryTransferModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleTransferInventory}>
              執行轉移
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

