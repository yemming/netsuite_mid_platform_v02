'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  ClipboardList, 
  Plus, 
  Search,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  FileText,
  ArrowRight
} from 'lucide-react';
import { 
  Customer, 
  CustomerRequirement, 
  WorkOrder,
  Case
} from '@/lib/field-operations-types';
import { useRouter } from 'next/navigation';

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [requirements, setRequirements] = useState<CustomerRequirement[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_requirements'>('with_requirements');
  const [selectedRequirement, setSelectedRequirement] = useState<CustomerRequirement | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workOrderFormData, setWorkOrderFormData] = useState({
    caseId: '',
    customerId: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    slaDeadline: '',
    caseTitle: '',
    caseDescription: '',
  });

  // 模擬資料
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: 'CUST-001',
        name: 'ABC 公司',
        address: '台北市信義區信義路五段7號',
        contactInfo: { phone: '02-1234-5678', email: 'contact@abc.com' },
      },
      {
        id: 'CUST-002',
        name: '科技大樓管理處',
        address: '台北市大安區敦化南路二段216號',
        contactInfo: { phone: '02-2345-6789', email: 'info@techbuilding.com' },
      },
      {
        id: 'CUST-003',
        name: '綠能科技公司',
        address: '新北市中和區中正路888號',
        contactInfo: { phone: '02-3456-7890', email: 'service@greenenergy.com' },
      },
      {
        id: 'CUST-004',
        name: '智慧家居展示中心',
        address: '台北市內湖區瑞光路258號',
        contactInfo: { phone: '02-4567-8901', email: 'showroom@smarthome.com' },
      },
      {
        id: 'CUST-005',
        name: '國際貿易大樓',
        address: '台北市松山區南京東路三段200號',
        contactInfo: { phone: '02-5678-9012', email: 'admin@tradetower.com' },
      },
    ];
    setCustomers(mockCustomers);

    const today = new Date().toISOString().split('T')[0];
    const mockRequirements: CustomerRequirement[] = [
      {
        id: 'REQ-001',
        customerId: 'CUST-001',
        title: '空調系統年度保養',
        description: '需要進行中央空調系統的年度保養作業，包括清洗濾網、檢查冷媒、測試運轉等',
        priority: 'high',
        status: 'pending',
        requestedDate: today,
        expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: today,
        updatedAt: today,
        customer: mockCustomers[0],
      },
      {
        id: 'REQ-002',
        customerId: 'CUST-002',
        title: '電梯系統檢查',
        description: '電梯系統需要定期檢查，確保安全運作',
        priority: 'medium',
        status: 'pending',
        requestedDate: today,
        createdAt: today,
        updatedAt: today,
        customer: mockCustomers[1],
      },
      {
        id: 'REQ-003',
        customerId: 'CUST-003',
        title: '太陽能板清潔維護',
        description: '定期清潔太陽能板並檢查系統運作狀況',
        priority: 'medium',
        status: 'pending',
        requestedDate: today,
        createdAt: today,
        updatedAt: today,
        customer: mockCustomers[2],
      },
      {
        id: 'REQ-004',
        customerId: 'CUST-004',
        title: '智慧家電系統設定',
        description: '協助客戶設定新的智慧家電系統',
        priority: 'low',
        status: 'pending',
        requestedDate: today,
        createdAt: today,
        updatedAt: today,
        customer: mockCustomers[3],
      },
      {
        id: 'REQ-005',
        customerId: 'CUST-005',
        title: '中央空調系統年度保養',
        description: '執行中央空調系統年度保養作業',
        priority: 'high',
        status: 'pending',
        requestedDate: today,
        createdAt: today,
        updatedAt: today,
        customer: mockCustomers[4],
      },
    ];
    setRequirements(mockRequirements);

    // 模擬已建立的工單（用於顯示）
    const mockWorkOrders: WorkOrder[] = [];
    setWorkOrders(mockWorkOrders);
  }, []);

  // 過濾有需求的客戶
  const customersWithRequirements = customers.filter(customer =>
    requirements.some(req => req.customerId === customer.id && req.status === 'pending')
  );

  // 過濾需求
  const filteredRequirements = requirements.filter(req => {
    if (req.status !== 'pending') return false;
    if (searchTerm) {
      const matchesSearch = 
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
    }
    return true;
  });

  // 處理從需求建立工單
  const handleCreateFromRequirement = (requirement: CustomerRequirement) => {
    setSelectedRequirement(requirement);
    const customer = customers.find(c => c.id === requirement.customerId);
    setWorkOrderFormData({
      caseId: '',
      customerId: requirement.customerId,
      priority: requirement.priority,
      slaDeadline: requirement.expectedDate || '',
      caseTitle: requirement.title,
      caseDescription: requirement.description,
    });
    setIsCreateModalOpen(true);
  };

  // 處理手動建立工單
  const handleCreateManually = () => {
    setSelectedRequirement(null);
    setWorkOrderFormData({
      caseId: '',
      customerId: '',
      priority: 'medium',
      slaDeadline: '',
      caseTitle: '',
      caseDescription: '',
    });
    setIsCreateModalOpen(true);
  };

  // 處理儲存工單
  const handleSaveWorkOrder = () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    
    // 建立案件
    const newCase: Case = {
      id: `CASE-${String(Date.now())}`,
      title: workOrderFormData.caseTitle,
      description: workOrderFormData.caseDescription,
      customerId: workOrderFormData.customerId,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };

    // 建立工單
    const customer = customers.find(c => c.id === workOrderFormData.customerId);
    const newWorkOrder: WorkOrder = {
      id: `WO-${String(Date.now())}`,
      caseId: newCase.id,
      status: 'pending',
      priority: workOrderFormData.priority,
      slaDeadline: workOrderFormData.slaDeadline || undefined,
      customer,
      case: newCase,
    };

    // 更新需求狀態（如果從需求建立）
    if (selectedRequirement) {
      setRequirements(requirements.map(req =>
        req.id === selectedRequirement.id
          ? { ...req, status: 'in_progress' }
          : req
      ));
    }

    // 儲存工單（實際應該呼叫 API）
    setWorkOrders([...workOrders, newWorkOrder]);
    
    // 關閉對話框
    setIsCreateModalOpen(false);
    setSelectedRequirement(null);

    // 提示成功並導向排程頁面
    alert(`工單 ${newWorkOrder.id} 已建立！`);
    router.push('/dashboard/field-operations/dispatch');
  };

  // 取得優先級標籤
  const getPriorityBadge = (priority: string) => {
    const config = {
      low: { label: '低', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
      medium: { label: '中', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      high: { label: '高', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      urgent: { label: '緊急', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    };
    const priorityConfig = config[priority as keyof typeof config] || config.medium;
    return <Badge className={priorityConfig.className}>{priorityConfig.label}</Badge>;
  };

  // 取得需求狀態標籤
  const getRequirementStatusBadge = (status: string) => {
    const config = {
      pending: { label: '待處理', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      in_progress: { label: '處理中', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      completed: { label: '已完成', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
    };
    const statusConfig = config[status as keyof typeof config] || config.pending;
    return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            建立工單
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            從客戶需求中選擇並建立工單，準備進行排程
          </p>
        </div>
        <Button onClick={handleCreateManually}>
          <Plus className="h-4 w-4 mr-2" />
          手動建立工單
        </Button>
      </div>

      {/* 搜尋與篩選 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="搜尋客戶需求..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部需求</SelectItem>
            <SelectItem value="with_requirements">僅有需求客戶</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 統計資訊 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">待處理需求</p>
                <p className="text-2xl font-bold">{filteredRequirements.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">有需求客戶</p>
                <p className="text-2xl font-bold">{customersWithRequirements.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">已建立工單</p>
                <p className="text-2xl font-bold">{workOrders.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 客戶需求列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            客戶需求列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequirements.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>目前沒有待處理的客戶需求</p>
              <p className="text-sm mt-2">您可以手動建立工單或前往客戶管理新增需求</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>需求標題</TableHead>
                  <TableHead>客戶</TableHead>
                  <TableHead>優先級</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>需求日期</TableHead>
                  <TableHead>預期日期</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequirements.map((requirement) => (
                  <TableRow key={requirement.id}>
                    <TableCell className="font-medium">{requirement.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {requirement.customer?.name || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(requirement.priority)}</TableCell>
                    <TableCell>{getRequirementStatusBadge(requirement.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {requirement.requestedDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      {requirement.expectedDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {requirement.expectedDate}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleCreateFromRequirement(requirement)}
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        建立工單
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 建立工單對話框 */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRequirement ? '從需求建立工單' : '手動建立工單'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequirement 
                ? '確認以下資訊並建立工單'
                : '填寫以下資訊以建立新工單'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="woCustomer">客戶 *</Label>
              <Select
                value={workOrderFormData.customerId}
                onValueChange={(value) => setWorkOrderFormData({ ...workOrderFormData, customerId: value })}
                disabled={!!selectedRequirement}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇客戶" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="woCaseTitle">案件標題 *</Label>
              <Input
                id="woCaseTitle"
                value={workOrderFormData.caseTitle}
                onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, caseTitle: e.target.value })}
                placeholder="輸入案件標題"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="woCaseDescription">案件描述 *</Label>
              <Textarea
                id="woCaseDescription"
                value={workOrderFormData.caseDescription}
                onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, caseDescription: e.target.value })}
                placeholder="輸入案件描述"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="woPriority">優先級 *</Label>
                <Select
                  value={workOrderFormData.priority}
                  onValueChange={(value: any) => setWorkOrderFormData({ ...workOrderFormData, priority: value })}
                >
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label htmlFor="woSlaDeadline">SLA 到期時間</Label>
                <Input
                  id="woSlaDeadline"
                  type="datetime-local"
                  value={workOrderFormData.slaDeadline}
                  onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, slaDeadline: e.target.value })}
                />
              </div>
            </div>
            {selectedRequirement && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  來源需求資訊
                </p>
                <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <p><span className="font-medium">需求 ID:</span> {selectedRequirement.id}</p>
                  <p><span className="font-medium">需求日期:</span> {selectedRequirement.requestedDate}</p>
                  {selectedRequirement.expectedDate && (
                    <p><span className="font-medium">預期日期:</span> {selectedRequirement.expectedDate}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleSaveWorkOrder}
              disabled={!workOrderFormData.customerId || !workOrderFormData.caseTitle || !workOrderFormData.caseDescription}
            >
              建立工單
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

