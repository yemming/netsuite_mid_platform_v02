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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  Users, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { 
  Customer, 
  CustomerRequirement, 
  CustomerCallback, 
  CompletionReport,
  CustomerRequirementStatus,
  CallbackStatus,
  CompletionReportStatus
} from '@/lib/field-operations-types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [requirements, setRequirements] = useState<CustomerRequirement[]>([]);
  const [callbacks, setCallbacks] = useState<CustomerCallback[]>([]);
  const [completionReports, setCompletionReports] = useState<CompletionReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'customers' | 'requirements' | 'callbacks' | 'reports'>('customers');
  
  // 客戶表單資料
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  });

  // 需求表單資料
  const [requirementFormData, setRequirementFormData] = useState({
    customerId: '',
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    requestedDate: '',
    expectedDate: '',
  });

  // 回櫃表單資料
  const [callbackFormData, setCallbackFormData] = useState({
    customerId: '',
    reason: '',
    notes: '',
    scheduledDate: '',
  });

  // 完工報告表單資料
  const [reportFormData, setReportFormData] = useState({
    workOrderId: '',
    customerId: '',
    title: '',
    summary: '',
    workPerformed: '',
    materialsUsed: '',
    customerFeedback: '',
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
        description: '需要進行中央空調系統的年度保養作業',
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
        description: '電梯系統需要定期檢查',
        priority: 'medium',
        status: 'pending',
        requestedDate: today,
        createdAt: today,
        updatedAt: today,
        customer: mockCustomers[1],
      },
    ];
    setRequirements(mockRequirements);

    const mockCallbacks: CustomerCallback[] = [
      {
        id: 'CB-001',
        customerId: 'CUST-001',
        reason: '服務後續追蹤',
        notes: '客戶詢問保養後續注意事項',
        status: 'completed',
        scheduledDate: today,
        completedDate: today,
        createdAt: today,
        updatedAt: today,
        customer: mockCustomers[0],
      },
    ];
    setCallbacks(mockCallbacks);

    const mockReports: CompletionReport[] = [
      {
        id: 'RPT-001',
        workOrderId: 'WO-001',
        customerId: 'CUST-001',
        title: '空調系統維修完工報告',
        summary: '完成空調系統故障排除',
        workPerformed: '更換壓縮機、清洗濾網、檢查冷媒',
        materialsUsed: '壓縮機 x1, 冷媒 x2',
        customerFeedback: '服務滿意',
        status: 'approved',
        submittedAt: today,
        approvedAt: today,
        createdAt: today,
        updatedAt: today,
        customer: mockCustomers[0],
      },
    ];
    setCompletionReports(mockReports);
  }, []);

  // 過濾客戶
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactInfo.phone?.includes(searchTerm) ||
    customer.contactInfo.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 過濾需求
  const filteredRequirements = requirements.filter(req =>
    req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 過濾回櫃
  const filteredCallbacks = callbacks.filter(cb =>
    cb.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cb.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 過濾完工報告
  const filteredReports = completionReports.filter(rpt =>
    rpt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rpt.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 處理新增客戶
  const handleAddCustomer = () => {
    setCustomerFormData({ name: '', address: '', phone: '', email: '' });
    setSelectedCustomer(null);
    setIsCustomerModalOpen(true);
  };

  // 處理編輯客戶
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerFormData({
      name: customer.name,
      address: customer.address,
      phone: customer.contactInfo.phone || '',
      email: customer.contactInfo.email || '',
    });
    setIsCustomerModalOpen(true);
  };

  // 處理儲存客戶
  const handleSaveCustomer = () => {
    if (selectedCustomer) {
      // 更新客戶
      setCustomers(customers.map(c => 
        c.id === selectedCustomer.id 
          ? {
              ...c,
              name: customerFormData.name,
              address: customerFormData.address,
              contactInfo: {
                phone: customerFormData.phone,
                email: customerFormData.email,
              },
            }
          : c
      ));
    } else {
      // 新增客戶
      const newCustomer: Customer = {
        id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
        name: customerFormData.name,
        address: customerFormData.address,
        contactInfo: {
          phone: customerFormData.phone,
          email: customerFormData.email,
        },
      };
      setCustomers([...customers, newCustomer]);
    }
    setIsCustomerModalOpen(false);
    setSelectedCustomer(null);
  };

  // 處理新增需求
  const handleAddRequirement = () => {
    setRequirementFormData({
      customerId: '',
      title: '',
      description: '',
      priority: 'medium',
      requestedDate: new Date().toISOString().split('T')[0],
      expectedDate: '',
    });
    setIsRequirementModalOpen(true);
  };

  // 處理儲存需求
  const handleSaveRequirement = () => {
    const today = new Date().toISOString().split('T')[0];
    const customer = customers.find(c => c.id === requirementFormData.customerId);
    const newRequirement: CustomerRequirement = {
      id: `REQ-${String(requirements.length + 1).padStart(3, '0')}`,
      customerId: requirementFormData.customerId,
      title: requirementFormData.title,
      description: requirementFormData.description,
      priority: requirementFormData.priority,
      status: 'pending',
      requestedDate: requirementFormData.requestedDate,
      expectedDate: requirementFormData.expectedDate || undefined,
      createdAt: today,
      updatedAt: today,
      customer,
    };
    setRequirements([...requirements, newRequirement]);
    setIsRequirementModalOpen(false);
  };

  // 處理新增回櫃
  const handleAddCallback = () => {
    setCallbackFormData({
      customerId: '',
      reason: '',
      notes: '',
      scheduledDate: '',
    });
    setIsCallbackModalOpen(true);
  };

  // 處理儲存回櫃
  const handleSaveCallback = () => {
    const today = new Date().toISOString().split('T')[0];
    const customer = customers.find(c => c.id === callbackFormData.customerId);
    const newCallback: CustomerCallback = {
      id: `CB-${String(callbacks.length + 1).padStart(3, '0')}`,
      customerId: callbackFormData.customerId,
      reason: callbackFormData.reason,
      notes: callbackFormData.notes,
      status: 'pending',
      scheduledDate: callbackFormData.scheduledDate || undefined,
      createdAt: today,
      updatedAt: today,
      customer,
    };
    setCallbacks([...callbacks, newCallback]);
    setIsCallbackModalOpen(false);
  };

  // 處理新增完工報告
  const handleAddReport = () => {
    setReportFormData({
      workOrderId: '',
      customerId: '',
      title: '',
      summary: '',
      workPerformed: '',
      materialsUsed: '',
      customerFeedback: '',
    });
    setIsReportModalOpen(true);
  };

  // 處理儲存完工報告
  const handleSaveReport = () => {
    const today = new Date().toISOString().split('T')[0];
    const customer = customers.find(c => c.id === reportFormData.customerId);
    const newReport: CompletionReport = {
      id: `RPT-${String(completionReports.length + 1).padStart(3, '0')}`,
      workOrderId: reportFormData.workOrderId,
      customerId: reportFormData.customerId,
      title: reportFormData.title,
      summary: reportFormData.summary,
      workPerformed: reportFormData.workPerformed,
      materialsUsed: reportFormData.materialsUsed || undefined,
      customerFeedback: reportFormData.customerFeedback || undefined,
      status: 'draft',
      createdAt: today,
      updatedAt: today,
      customer,
    };
    setCompletionReports([...completionReports, newReport]);
    setIsReportModalOpen(false);
  };

  // 取得狀態標籤
  const getRequirementStatusBadge = (status: CustomerRequirementStatus) => {
    const config = {
      pending: { label: '待處理', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      in_progress: { label: '處理中', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      completed: { label: '已完成', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
    };
    const statusConfig = config[status];
    return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;
  };

  const getCallbackStatusBadge = (status: CallbackStatus) => {
    const config = {
      pending: { label: '待處理', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      scheduled: { label: '已排程', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      completed: { label: '已完成', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
    };
    const statusConfig = config[status];
    return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;
  };

  const getReportStatusBadge = (status: CompletionReportStatus) => {
    const config = {
      draft: { label: '草稿', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
      submitted: { label: '已提交', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      approved: { label: '已核准', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      rejected: { label: '已拒絕', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    };
    const statusConfig = config[status];
    return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;
  };

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            客戶管理
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            管理客戶資料、需求、回櫃與完工報告
          </p>
        </div>
      </div>

      {/* 搜尋列 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="搜尋客戶、需求、回櫃或報告..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 標籤頁 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="customers">客戶資料</TabsTrigger>
          <TabsTrigger value="requirements">客戶需求</TabsTrigger>
          <TabsTrigger value="callbacks">客戶回櫃</TabsTrigger>
          <TabsTrigger value="reports">完工報告</TabsTrigger>
        </TabsList>

        {/* 客戶資料標籤 */}
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  客戶列表
                </CardTitle>
                <Button onClick={handleAddCustomer} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  新增客戶
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客戶名稱</TableHead>
                    <TableHead>地址</TableHead>
                    <TableHead>聯絡電話</TableHead>
                    <TableHead>電子郵件</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        沒有找到客戶資料
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {customer.address}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {customer.contactInfo.phone || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {customer.contactInfo.email || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 客戶需求標籤 */}
        <TabsContent value="requirements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  客戶需求
                </CardTitle>
                <Button onClick={handleAddRequirement} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  新增需求
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>需求標題</TableHead>
                    <TableHead>客戶</TableHead>
                    <TableHead>優先級</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>需求日期</TableHead>
                    <TableHead>預期日期</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequirements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        沒有找到客戶需求
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequirements.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.title}</TableCell>
                        <TableCell>{req.customer?.name || 'N/A'}</TableCell>
                        <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                        <TableCell>{getRequirementStatusBadge(req.status)}</TableCell>
                        <TableCell>{req.requestedDate}</TableCell>
                        <TableCell>{req.expectedDate || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 客戶回櫃標籤 */}
        <TabsContent value="callbacks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  客戶回櫃
                </CardTitle>
                <Button onClick={handleAddCallback} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  新增回櫃
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客戶</TableHead>
                    <TableHead>回櫃原因</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>排程日期</TableHead>
                    <TableHead>完成日期</TableHead>
                    <TableHead>備註</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCallbacks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        沒有找到客戶回櫃記錄
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCallbacks.map((cb) => (
                      <TableRow key={cb.id}>
                        <TableCell className="font-medium">{cb.customer?.name || 'N/A'}</TableCell>
                        <TableCell>{cb.reason}</TableCell>
                        <TableCell>{getCallbackStatusBadge(cb.status)}</TableCell>
                        <TableCell>{cb.scheduledDate || 'N/A'}</TableCell>
                        <TableCell>{cb.completedDate || 'N/A'}</TableCell>
                        <TableCell>{cb.notes || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 完工報告標籤 */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  完工報告
                </CardTitle>
                <Button onClick={handleAddReport} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  新增報告
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>報告標題</TableHead>
                    <TableHead>客戶</TableHead>
                    <TableHead>工單 ID</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>提交日期</TableHead>
                    <TableHead>摘要</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        沒有找到完工報告
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((rpt) => (
                      <TableRow key={rpt.id}>
                        <TableCell className="font-medium">{rpt.title}</TableCell>
                        <TableCell>{rpt.customer?.name || 'N/A'}</TableCell>
                        <TableCell>{rpt.workOrderId}</TableCell>
                        <TableCell>{getReportStatusBadge(rpt.status)}</TableCell>
                        <TableCell>{rpt.submittedAt || 'N/A'}</TableCell>
                        <TableCell className="max-w-xs truncate">{rpt.summary}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 新增/編輯客戶對話框 */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCustomer ? '編輯客戶' : '新增客戶'}</DialogTitle>
            <DialogDescription>
              {selectedCustomer ? '修改客戶資料' : '填寫以下資訊以新增客戶'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">客戶名稱 *</Label>
              <Input
                id="customerName"
                value={customerFormData.name}
                onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                placeholder="輸入客戶名稱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">地址 *</Label>
              <Input
                id="address"
                value={customerFormData.address}
                onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                placeholder="輸入地址"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">聯絡電話</Label>
              <Input
                id="phone"
                value={customerFormData.phone}
                onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                placeholder="輸入聯絡電話"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">電子郵件</Label>
              <Input
                id="email"
                type="email"
                value={customerFormData.email}
                onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                placeholder="輸入電子郵件"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomerModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveCustomer}>
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增需求對話框 */}
      <Dialog open={isRequirementModalOpen} onOpenChange={setIsRequirementModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增客戶需求</DialogTitle>
            <DialogDescription>
              記錄客戶的新需求
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reqCustomer">客戶 *</Label>
              <Select
                value={requirementFormData.customerId}
                onValueChange={(value) => setRequirementFormData({ ...requirementFormData, customerId: value })}
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
              <Label htmlFor="reqTitle">需求標題 *</Label>
              <Input
                id="reqTitle"
                value={requirementFormData.title}
                onChange={(e) => setRequirementFormData({ ...requirementFormData, title: e.target.value })}
                placeholder="輸入需求標題"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reqDescription">需求描述 *</Label>
              <Textarea
                id="reqDescription"
                value={requirementFormData.description}
                onChange={(e) => setRequirementFormData({ ...requirementFormData, description: e.target.value })}
                placeholder="輸入需求描述"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reqPriority">優先級 *</Label>
                <Select
                  value={requirementFormData.priority}
                  onValueChange={(value: any) => setRequirementFormData({ ...requirementFormData, priority: value })}
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
                <Label htmlFor="reqRequestedDate">需求日期 *</Label>
                <Input
                  id="reqRequestedDate"
                  type="date"
                  value={requirementFormData.requestedDate}
                  onChange={(e) => setRequirementFormData({ ...requirementFormData, requestedDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reqExpectedDate">預期完成日期</Label>
              <Input
                id="reqExpectedDate"
                type="date"
                value={requirementFormData.expectedDate}
                onChange={(e) => setRequirementFormData({ ...requirementFormData, expectedDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequirementModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveRequirement}>
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增回櫃對話框 */}
      <Dialog open={isCallbackModalOpen} onOpenChange={setIsCallbackModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增客戶回櫃</DialogTitle>
            <DialogDescription>
              記錄客戶回櫃資訊
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cbCustomer">客戶 *</Label>
              <Select
                value={callbackFormData.customerId}
                onValueChange={(value) => setCallbackFormData({ ...callbackFormData, customerId: value })}
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
              <Label htmlFor="cbReason">回櫃原因 *</Label>
              <Input
                id="cbReason"
                value={callbackFormData.reason}
                onChange={(e) => setCallbackFormData({ ...callbackFormData, reason: e.target.value })}
                placeholder="輸入回櫃原因"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cbNotes">備註</Label>
              <Textarea
                id="cbNotes"
                value={callbackFormData.notes}
                onChange={(e) => setCallbackFormData({ ...callbackFormData, notes: e.target.value })}
                placeholder="輸入備註"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cbScheduledDate">排程日期</Label>
              <Input
                id="cbScheduledDate"
                type="date"
                value={callbackFormData.scheduledDate}
                onChange={(e) => setCallbackFormData({ ...callbackFormData, scheduledDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCallbackModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveCallback}>
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增完工報告對話框 */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增完工報告</DialogTitle>
            <DialogDescription>
              建立完工報告
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rptCustomer">客戶 *</Label>
                <Select
                  value={reportFormData.customerId}
                  onValueChange={(value) => setReportFormData({ ...reportFormData, customerId: value })}
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
                <Label htmlFor="rptWorkOrder">工單 ID *</Label>
                <Input
                  id="rptWorkOrder"
                  value={reportFormData.workOrderId}
                  onChange={(e) => setReportFormData({ ...reportFormData, workOrderId: e.target.value })}
                  placeholder="輸入工單 ID"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rptTitle">報告標題 *</Label>
              <Input
                id="rptTitle"
                value={reportFormData.title}
                onChange={(e) => setReportFormData({ ...reportFormData, title: e.target.value })}
                placeholder="輸入報告標題"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rptSummary">摘要 *</Label>
              <Textarea
                id="rptSummary"
                value={reportFormData.summary}
                onChange={(e) => setReportFormData({ ...reportFormData, summary: e.target.value })}
                placeholder="輸入摘要"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rptWorkPerformed">執行工作 *</Label>
              <Textarea
                id="rptWorkPerformed"
                value={reportFormData.workPerformed}
                onChange={(e) => setReportFormData({ ...reportFormData, workPerformed: e.target.value })}
                placeholder="輸入執行的工作內容"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rptMaterials">使用材料</Label>
              <Input
                id="rptMaterials"
                value={reportFormData.materialsUsed}
                onChange={(e) => setReportFormData({ ...reportFormData, materialsUsed: e.target.value })}
                placeholder="輸入使用的材料"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rptFeedback">客戶回饋</Label>
              <Textarea
                id="rptFeedback"
                value={reportFormData.customerFeedback}
                onChange={(e) => setReportFormData({ ...reportFormData, customerFeedback: e.target.value })}
                placeholder="輸入客戶回饋"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveReport}>
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

