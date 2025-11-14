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
  Hammer, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Wrench,
  AlertCircle,
  Calendar,
  MapPin,
  User
} from 'lucide-react';
import { Resource, ResourceStatus, ResourceType } from '@/lib/field-operations-types';

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'vehicle' as ResourceType,
    serialNumber: '',
    description: '',
    status: 'available' as ResourceStatus,
    location: '',
    assignedTo: '',
    purchaseDate: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    notes: '',
  });

  // 模擬資料
  useEffect(() => {
    const mockResources: Resource[] = [
      {
        id: 'RES-001',
        name: '工程車 A',
        type: 'vehicle',
        serialNumber: 'VEH-2024-001',
        description: '3.5 噸工程車，配備工具箱',
        status: 'available',
        location: '總部倉庫',
        purchaseDate: '2023-01-15',
        lastMaintenanceDate: '2024-12-01',
        nextMaintenanceDate: '2025-03-01',
      },
      {
        id: 'RES-002',
        name: '吊掛機 B',
        type: 'crane',
        serialNumber: 'CRN-2023-005',
        description: '小型移動式吊掛機，最大載重 5 噸',
        status: 'in_use',
        location: '現場使用中',
        assignedTo: 'TECH-001',
        purchaseDate: '2023-06-20',
        lastMaintenanceDate: '2024-11-15',
        nextMaintenanceDate: '2025-02-15',
      },
      {
        id: 'RES-003',
        name: '怪手 C',
        type: 'excavator',
        serialNumber: 'EXC-2022-012',
        description: '中型挖掘機，適用於各種工程',
        status: 'maintenance',
        location: '維修廠',
        purchaseDate: '2022-08-10',
        lastMaintenanceDate: '2024-10-20',
        nextMaintenanceDate: '2025-01-20',
        notes: '液壓系統檢修中',
      },
      {
        id: 'RES-004',
        name: '空氣壓縮機 D',
        type: 'compressor',
        serialNumber: 'CMP-2024-003',
        description: '移動式空氣壓縮機，壓力 10 bar',
        status: 'available',
        location: '總部倉庫',
        purchaseDate: '2024-03-05',
        lastMaintenanceDate: '2024-12-10',
        nextMaintenanceDate: '2025-03-10',
      },
      {
        id: 'RES-005',
        name: '發電機 E',
        type: 'generator',
        serialNumber: 'GEN-2023-008',
        description: '柴油發電機，功率 20kW',
        status: 'available',
        location: '總部倉庫',
        purchaseDate: '2023-09-12',
        lastMaintenanceDate: '2024-11-25',
        nextMaintenanceDate: '2025-02-25',
      },
      {
        id: 'RES-006',
        name: '工程車 F',
        type: 'vehicle',
        serialNumber: 'VEH-2024-002',
        description: '5 噸工程車，配備升降平台',
        status: 'in_use',
        location: '現場使用中',
        assignedTo: 'TECH-002',
        purchaseDate: '2024-05-18',
        lastMaintenanceDate: '2024-12-05',
        nextMaintenanceDate: '2025-03-05',
      },
    ];
    setResources(mockResources);
  }, []);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = 
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || resource.status === statusFilter;
    const matchesType = typeFilter === 'all' || resource.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAdd = () => {
    setFormData({
      name: '',
      type: 'vehicle',
      serialNumber: '',
      description: '',
      status: 'available',
      location: '',
      assignedTo: '',
      purchaseDate: '',
      lastMaintenanceDate: '',
      nextMaintenanceDate: '',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setFormData({
      name: resource.name,
      type: resource.type,
      serialNumber: resource.serialNumber || '',
      description: resource.description || '',
      status: resource.status,
      location: resource.location || '',
      assignedTo: resource.assignedTo || '',
      purchaseDate: resource.purchaseDate || '',
      lastMaintenanceDate: resource.lastMaintenanceDate || '',
      nextMaintenanceDate: resource.nextMaintenanceDate || '',
      notes: resource.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    if (isAddModalOpen) {
      // 新增資源
      const newResource: Resource = {
        id: `RES-${String(resources.length + 1).padStart(3, '0')}`,
        ...formData,
      };
      setResources([...resources, newResource]);
      setIsAddModalOpen(false);
    } else if (isEditModalOpen && selectedResource) {
      // 編輯資源
      setResources(resources.map(r => 
        r.id === selectedResource.id ? { ...r, ...formData } : r
      ));
      setIsEditModalOpen(false);
      setSelectedResource(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除此資源嗎？')) {
      setResources(resources.filter(r => r.id !== id));
    }
  };

  const getTypeLabel = (type: ResourceType) => {
    const typeMap: Record<ResourceType, string> = {
      vehicle: '車輛',
      crane: '吊掛機',
      excavator: '怪手',
      compressor: '空氣壓縮機',
      generator: '發電機',
      tool: '工具',
      other: '其他',
    };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: ResourceStatus) => {
    const statusMap: Record<ResourceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      available: { label: '可用', variant: 'default' },
      in_use: { label: '使用中', variant: 'secondary' },
      maintenance: { label: '維修中', variant: 'destructive' },
      disabled: { label: '停用', variant: 'outline' },
    };
    const statusInfo = statusMap[status];
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getTechnicianName = (technicianId: string) => {
    const nameMap: Record<string, string> = {
      'TECH-001': '魯夫',
      'TECH-002': '索隆',
      'TECH-003': '香吉士',
      'TECH-004': '佛朗基',
    };
    return nameMap[technicianId] || technicianId;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Hammer className="h-8 w-8" />
            資源管理
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            管理工程所需的工具和機械設備，包括車輛、吊掛機、怪手、空氣壓縮機等
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          新增資源
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>資源列表</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜尋資源..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部類型</SelectItem>
                  <SelectItem value="vehicle">車輛</SelectItem>
                  <SelectItem value="crane">吊掛機</SelectItem>
                  <SelectItem value="excavator">怪手</SelectItem>
                  <SelectItem value="compressor">空氣壓縮機</SelectItem>
                  <SelectItem value="generator">發電機</SelectItem>
                  <SelectItem value="tool">工具</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="available">可用</SelectItem>
                  <SelectItem value="in_use">使用中</SelectItem>
                  <SelectItem value="maintenance">維修中</SelectItem>
                  <SelectItem value="disabled">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>資源名稱</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>序列號</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>位置</TableHead>
                <TableHead>分配給</TableHead>
                <TableHead>下次維護</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    沒有找到符合條件的資源
                  </TableCell>
                </TableRow>
              ) : (
                filteredResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(resource.type)}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {resource.serialNumber || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(resource.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {resource.location || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {resource.assignedTo ? (
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3" />
                          {getTechnicianName(resource.assignedTo)}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">未分配</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {resource.nextMaintenanceDate ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(resource.nextMaintenanceDate).toLocaleDateString('zh-TW')}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(resource)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(resource.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
          setSelectedResource(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAddModalOpen ? '新增資源' : '編輯資源'}</DialogTitle>
            <DialogDescription>
              {isAddModalOpen ? '填寫以下資訊以新增資源' : '修改資源資訊'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">資源名稱</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: 工程車 A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">類型</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ResourceType) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vehicle">車輛</SelectItem>
                    <SelectItem value="crane">吊掛機</SelectItem>
                    <SelectItem value="excavator">怪手</SelectItem>
                    <SelectItem value="compressor">空氣壓縮機</SelectItem>
                    <SelectItem value="generator">發電機</SelectItem>
                    <SelectItem value="tool">工具</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serialNumber">序列號</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="例如: VEH-2024-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">狀態</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ResourceStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">可用</SelectItem>
                    <SelectItem value="in_use">使用中</SelectItem>
                    <SelectItem value="maintenance">維修中</SelectItem>
                    <SelectItem value="disabled">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="輸入資源描述"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">位置</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="例如: 總部倉庫"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">分配給</Label>
                <Select
                  value={formData.assignedTo || 'unassigned'}
                  onValueChange={(value) => setFormData({ ...formData, assignedTo: value === 'unassigned' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇技術人員" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">未分配</SelectItem>
                    <SelectItem value="TECH-001">魯夫</SelectItem>
                    <SelectItem value="TECH-002">索隆</SelectItem>
                    <SelectItem value="TECH-003">香吉士</SelectItem>
                    <SelectItem value="TECH-004">佛朗基</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">購買日期</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastMaintenanceDate">最後維護日期</Label>
                <Input
                  id="lastMaintenanceDate"
                  type="date"
                  value={formData.lastMaintenanceDate}
                  onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextMaintenanceDate">下次維護日期</Label>
                <Input
                  id="nextMaintenanceDate"
                  type="date"
                  value={formData.nextMaintenanceDate}
                  onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">備註</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="輸入備註資訊"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setSelectedResource(null);
            }}>
              取消
            </Button>
            <Button onClick={handleSave}>
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

