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
  Package, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  Warehouse,
  Truck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { InventoryItem, TechnicianStock } from '@/lib/field-operations-types';

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [technicianStocks, setTechnicianStocks] = useState<TechnicianStock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    partNumber: '',
    name: '',
    description: '',
    unitPrice: '',
    stockQuantity: '',
  });
  const [transferData, setTransferData] = useState({
    itemId: '',
    from: 'warehouse',
    to: '',
    quantity: '',
  });

  // 模擬資料
  useEffect(() => {
    const mockInventory: InventoryItem[] = [
      { 
        id: 'ITEM-001', 
        partNumber: 'FILTER-001', 
        name: '空調濾網', 
        description: '標準空調濾網，適用於大部分空調系統', 
        unitPrice: 500, 
        stockQuantity: 50 
      },
      { 
        id: 'ITEM-002', 
        partNumber: 'CABLE-001', 
        name: '網路線', 
        description: 'Cat6 網路線，長度 5 米', 
        unitPrice: 200, 
        stockQuantity: 100 
      },
      { 
        id: 'ITEM-003', 
        partNumber: 'FUSE-001', 
        name: '保險絲', 
        description: '標準保險絲，10A', 
        unitPrice: 100, 
        stockQuantity: 200 
      },
      { 
        id: 'ITEM-004', 
        partNumber: 'BATTERY-001', 
        name: '備用電池', 
        description: 'UPS 備用電池', 
        unitPrice: 1500, 
        stockQuantity: 15 
      },
      { 
        id: 'ITEM-005', 
        partNumber: 'SENSOR-001', 
        name: '溫度感應器', 
        description: '數位溫度感應器', 
        unitPrice: 800, 
        stockQuantity: 30 
      },
    ];
    setInventoryItems(mockInventory);

    const mockTechnicianStocks: TechnicianStock[] = [
      { id: 'TS-001', technicianId: 'TECH-001', itemId: 'ITEM-001', quantity: 5 },
      { id: 'TS-002', technicianId: 'TECH-001', itemId: 'ITEM-002', quantity: 10 },
      { id: 'TS-003', technicianId: 'TECH-002', itemId: 'ITEM-001', quantity: 3 },
      { id: 'TS-004', technicianId: 'TECH-002', itemId: 'ITEM-003', quantity: 20 },
    ];
    setTechnicianStocks(mockTechnicianStocks);
  }, []);

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({
      partNumber: '',
      name: '',
      description: '',
      unitPrice: '',
      stockQuantity: '',
    });
    setIsAddModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      partNumber: item.partNumber,
      name: item.name,
      description: item.description || '',
      unitPrice: item.unitPrice.toString(),
      stockQuantity: item.stockQuantity.toString(),
    });
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    if (isAddModalOpen) {
      // 新增料件
      const newItem: InventoryItem = {
        id: `ITEM-${String(inventoryItems.length + 1).padStart(3, '0')}`,
        partNumber: formData.partNumber,
        name: formData.name,
        description: formData.description,
        unitPrice: parseFloat(formData.unitPrice) || 0,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
      };
      setInventoryItems([...inventoryItems, newItem]);
      setIsAddModalOpen(false);
    } else if (isEditModalOpen && selectedItem) {
      // 編輯料件
      setInventoryItems(inventoryItems.map(item => 
        item.id === selectedItem.id ? {
          ...item,
          partNumber: formData.partNumber,
          name: formData.name,
          description: formData.description,
          unitPrice: parseFloat(formData.unitPrice) || 0,
          stockQuantity: parseInt(formData.stockQuantity) || 0,
        } : item
      ));
      setIsEditModalOpen(false);
      setSelectedItem(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除此料件嗎？')) {
      setInventoryItems(inventoryItems.filter(item => item.id !== id));
    }
  };

  const handleTransfer = () => {
    // 處理庫存轉移邏輯
    const item = inventoryItems.find(i => i.id === transferData.itemId);
    if (!item) return;

    const quantity = parseInt(transferData.quantity);
    if (transferData.from === 'warehouse') {
      // 從倉庫轉移到技術人員
      if (item.stockQuantity >= quantity) {
        setInventoryItems(inventoryItems.map(i => 
          i.id === transferData.itemId 
            ? { ...i, stockQuantity: i.stockQuantity - quantity }
            : i
        ));
        // 更新技術人員庫存
        const existingStock = technicianStocks.find(
          ts => ts.technicianId === transferData.to && ts.itemId === transferData.itemId
        );
        if (existingStock) {
          setTechnicianStocks(technicianStocks.map(ts =>
            ts.id === existingStock.id
              ? { ...ts, quantity: ts.quantity + quantity }
              : ts
          ));
        } else {
          setTechnicianStocks([...technicianStocks, {
            id: `TS-${String(technicianStocks.length + 1).padStart(3, '0')}`,
            technicianId: transferData.to,
            itemId: transferData.itemId,
            quantity: quantity,
          }]);
        }
        setIsTransferModalOpen(false);
        setTransferData({ itemId: '', from: 'warehouse', to: '', quantity: '' });
      } else {
        alert('倉庫庫存不足');
      }
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: '缺貨', variant: 'destructive' as const, icon: AlertCircle };
    if (quantity < 10) return { label: '庫存不足', variant: 'secondary' as const, icon: AlertCircle };
    return { label: '庫存充足', variant: 'default' as const, icon: CheckCircle2 };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            料件管理
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            管理庫存料件、追蹤庫存數量並執行庫存轉移
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsTransferModalOpen(true)}>
            <Truck className="h-4 w-4 mr-2" />
            庫存轉移
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            新增料件
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>料件列表</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜尋料件..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>料件編號</TableHead>
                <TableHead>料件名稱</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>單價</TableHead>
                <TableHead>庫存數量</TableHead>
                <TableHead>庫存狀態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    沒有找到符合條件的料件
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const status = getStockStatus(item.stockQuantity);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.partNumber}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-gray-500 text-sm">{item.description}</TableCell>
                      <TableCell>NT$ {item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell>{item.stockQuantity}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增/編輯對話框 */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isAddModalOpen ? '新增料件' : '編輯料件'}</DialogTitle>
            <DialogDescription>
              {isAddModalOpen ? '填寫以下資訊以新增料件' : '修改料件資訊'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="partNumber">料件編號</Label>
              <Input
                id="partNumber"
                value={formData.partNumber}
                onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                placeholder="例如: FILTER-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">料件名稱</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="輸入料件名稱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="輸入料件描述"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">單價 (NT$)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">庫存數量</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setSelectedItem(null);
            }}>
              取消
            </Button>
            <Button onClick={handleSave}>
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 庫存轉移對話框 */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>庫存轉移</DialogTitle>
            <DialogDescription>
              從倉庫轉移料件到技術人員的車輛庫存
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transferItem">選擇料件</Label>
              <Select
                value={transferData.itemId}
                onValueChange={(value) => setTransferData({ ...transferData, itemId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇要轉移的料件" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.partNumber} - {item.name} (庫存: {item.stockQuantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transferTo">轉移到技術人員</Label>
              <Select
                value={transferData.to}
                onValueChange={(value) => setTransferData({ ...transferData, to: value })}
              >
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="transferQuantity">轉移數量</Label>
              <Input
                id="transferQuantity"
                type="number"
                value={transferData.quantity}
                onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
                placeholder="輸入轉移數量"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleTransfer}>
              確認轉移
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

