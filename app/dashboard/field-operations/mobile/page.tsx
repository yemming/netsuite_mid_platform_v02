'use client';

import { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Smartphone, 
  MapPin, 
  Phone, 
  Navigation, 
  Clock, 
  CheckCircle2,
  PlayCircle,
  Square,
  FileText,
  Package,
  User,
  Calendar,
  Camera,
  X,
  Eraser,
  Edit
} from 'lucide-react';
import { WorkOrder, ServiceReport, PartUsed, InventoryItem } from '@/lib/field-operations-types';

export default function MobileTechnicianPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [activeTab, setActiveTab] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [hoursLogged, setHoursLogged] = useState('');
  const [summaryNotes, setSummaryNotes] = useState('');
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [availableParts, setAvailableParts] = useState<InventoryItem[]>([]);
  const [signatureData, setSignatureData] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]); // 儲存照片的 base64 或 URL
  const signatureCanvasRef = useRef<SignatureCanvas>(null);
  
  // GPS 位置狀態
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
    address?: string;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // 工程師姓名
  const [technicianName, setTechnicianName] = useState<string>('');

  // 獲取工程師姓名
  useEffect(() => {
    const fetchTechnicianName = async () => {
      try {
        const supabase = createClient();
        
        // 取得當前使用者
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('無法取得使用者資訊:', userError);
          return;
        }

        // 先嘗試從 user_profiles 取得姓名
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle();

        if (userProfile?.name) {
          setTechnicianName(userProfile.name);
          return;
        }

        // 如果 user_profiles 沒有姓名，嘗試從 field_operations_personnel 根據 email 查找
        if (user.email) {
          const { data: personnel } = await supabase
            .from('field_operations_personnel')
            .select('name')
            .eq('email', user.email)
            .maybeSingle();

          if (personnel?.name) {
            setTechnicianName(personnel.name);
            return;
          }
        }

        // 如果都找不到，使用 user_metadata 或 email 的前綴
        const fallbackName = user.user_metadata?.full_name || user.email?.split('@')[0] || '工程師';
        setTechnicianName(fallbackName);
      } catch (error) {
        console.error('取得工程師姓名錯誤:', error);
        setTechnicianName('工程師');
      }
    };

    fetchTechnicianName();
  }, []);

  // 獲取 GPS 位置
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('您的瀏覽器不支援 GPS 定位功能');
      return;
    }

    setIsGettingLocation(true);
    setGpsError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsLocation({
          latitude,
          longitude,
          accuracy,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('GPS 定位錯誤:', error);
        let errorMessage = '無法取得 GPS 位置';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'GPS 定位權限被拒絕';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'GPS 位置資訊不可用';
            break;
          case error.TIMEOUT:
            errorMessage = 'GPS 定位逾時';
            break;
        }
        setGpsError(errorMessage);
        setIsGettingLocation(false);
      },
      options
    );
  }, []);

  // 模擬資料
  useEffect(() => {
    // TODO: 從 API 載入實際資料
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 格式化日期為 YYYY-MM-DD
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(yesterday);
    const tomorrowStr = formatDate(tomorrow);

    const mockWorkOrders: WorkOrder[] = [
      // 昨天的工單（已完成）
      {
        id: 'WO-001',
        caseId: 'CASE-001',
        status: 'completed',
        technicianId: 'TECH-001',
        scheduledStartTime: `${yesterdayStr}T09:00:00`,
        scheduledEndTime: `${yesterdayStr}T12:00:00`,
        actualStartTime: `${yesterdayStr}T09:15:00`,
        actualEndTime: `${yesterdayStr}T11:45:00`,
        customer: {
          id: 'CUST-001',
          name: 'ABC 公司',
          address: '台北市信義區信義路五段7號',
          contactInfo: { phone: '02-1234-5678', email: 'contact@abc.com' },
        },
        case: {
          id: 'CASE-001',
          title: '空調系統故障維修',
          description: '辦公室空調無法運轉，已更換濾網並清潔系統',
          customerId: 'CUST-001',
          status: 'closed',
          createdAt: `${yesterdayStr}T08:00:00`,
          updatedAt: `${yesterdayStr}T12:00:00`,
        },
      },
      {
        id: 'WO-002',
        caseId: 'CASE-002',
        status: 'completed',
        technicianId: 'TECH-001',
        scheduledStartTime: `${yesterdayStr}T14:00:00`,
        scheduledEndTime: `${yesterdayStr}T17:00:00`,
        actualStartTime: `${yesterdayStr}T14:10:00`,
        actualEndTime: `${yesterdayStr}T16:30:00`,
        customer: {
          id: 'CUST-002',
          name: 'XYZ 企業',
          address: '新北市板橋區文化路一段188巷',
          contactInfo: { phone: '02-9876-5432' },
        },
        case: {
          id: 'CASE-002',
          title: '網路設備定期檢查',
          description: '完成網路設備定期維護檢查，所有設備運作正常',
          customerId: 'CUST-002',
          status: 'closed',
          createdAt: `${yesterdayStr}T10:00:00`,
          updatedAt: `${yesterdayStr}T17:00:00`,
        },
      },
      // 今天的工單
      {
        id: 'WO-003',
        caseId: 'CASE-003',
        status: 'dispatched',
        technicianId: 'TECH-001',
        scheduledStartTime: `${todayStr}T09:00:00`,
        scheduledEndTime: `${todayStr}T12:00:00`,
        priority: 'high',
        customer: {
          id: 'CUST-003',
          name: '科技大樓管理處',
          address: '台北市大安區敦化南路二段216號',
          contactInfo: { phone: '02-2345-6789', email: 'admin@techbuilding.com' },
        },
        case: {
          id: 'CASE-003',
          title: '電梯故障緊急維修',
          description: 'B棟電梯無法正常運作，需要緊急處理',
          customerId: 'CUST-003',
          status: 'open',
          createdAt: `${todayStr}T08:00:00`,
          updatedAt: `${todayStr}T08:00:00`,
        },
      },
      {
        id: 'WO-004',
        caseId: 'CASE-004',
        status: 'in_progress',
        technicianId: 'TECH-001',
        scheduledStartTime: `${todayStr}T10:00:00`,
        scheduledEndTime: `${todayStr}T13:00:00`,
        actualStartTime: `${todayStr}T10:15:00`,
        priority: 'medium',
        customer: {
          id: 'CUST-004',
          name: '綠能科技公司',
          address: '新北市中和區中正路888號',
          contactInfo: { phone: '02-3456-7890' },
        },
        case: {
          id: 'CASE-004',
          title: '太陽能板清潔維護',
          description: '定期清潔太陽能板並檢查系統運作狀況',
          customerId: 'CUST-004',
          status: 'open',
          createdAt: `${todayStr}T09:00:00`,
          updatedAt: `${todayStr}T10:15:00`,
        },
      },
      {
        id: 'WO-005',
        caseId: 'CASE-005',
        status: 'scheduled',
        technicianId: 'TECH-001',
        scheduledStartTime: `${todayStr}T14:00:00`,
        scheduledEndTime: `${todayStr}T17:00:00`,
        priority: 'low',
        customer: {
          id: 'CUST-005',
          name: '智慧家居展示中心',
          address: '台北市內湖區瑞光路258號',
          contactInfo: { phone: '02-4567-8901', email: 'service@smarthome.com' },
        },
        case: {
          id: 'CASE-005',
          title: '智慧家電系統設定',
          description: '協助客戶設定新的智慧家電系統',
          customerId: 'CUST-005',
          status: 'open',
          createdAt: `${todayStr}T11:00:00`,
          updatedAt: `${todayStr}T11:00:00`,
        },
      },
      // 明天的工單
      {
        id: 'WO-006',
        caseId: 'CASE-006',
        status: 'scheduled',
        technicianId: 'TECH-001',
        scheduledStartTime: `${tomorrowStr}T09:00:00`,
        scheduledEndTime: `${tomorrowStr}T12:00:00`,
        priority: 'high',
        customer: {
          id: 'CUST-006',
          name: '國際貿易大樓',
          address: '台北市松山區南京東路三段200號',
          contactInfo: { phone: '02-5678-9012' },
        },
        case: {
          id: 'CASE-006',
          title: '中央空調系統年度保養',
          description: '執行中央空調系統年度保養作業，包含清潔、檢查、更換零件',
          customerId: 'CUST-006',
          status: 'open',
          createdAt: `${todayStr}T10:00:00`,
          updatedAt: `${todayStr}T10:00:00`,
        },
      },
      {
        id: 'WO-007',
        caseId: 'CASE-007',
        status: 'scheduled',
        technicianId: 'TECH-001',
        scheduledStartTime: `${tomorrowStr}T13:00:00`,
        scheduledEndTime: `${tomorrowStr}T16:00:00`,
        priority: 'medium',
        customer: {
          id: 'CUST-007',
          name: '創新園區管理委員會',
          address: '新竹市東區光復路二段101號',
          contactInfo: { phone: '03-1234-5678', email: 'admin@innovationpark.com' },
        },
        case: {
          id: 'CASE-007',
          title: '監控系統升級',
          description: '升級園區監控系統，安裝新的攝影機和錄影設備',
          customerId: 'CUST-007',
          status: 'open',
          createdAt: `${todayStr}T14:00:00`,
          updatedAt: `${todayStr}T14:00:00`,
        },
      },
      {
        id: 'WO-008',
        caseId: 'CASE-008',
        status: 'scheduled',
        technicianId: 'TECH-001',
        scheduledStartTime: `${tomorrowStr}T10:00:00`,
        scheduledEndTime: `${tomorrowStr}T13:00:00`,
        priority: 'low',
        customer: {
          id: 'CUST-008',
          name: '社區管理委員會',
          address: '桃園市中壢區中正路123號',
          contactInfo: { phone: '03-2345-6789' },
        },
        case: {
          id: 'CASE-008',
          title: '門禁系統故障排除',
          description: '社區門禁系統無法正常運作，需要檢查並修復',
          customerId: 'CUST-008',
          status: 'open',
          createdAt: `${todayStr}T15:00:00`,
          updatedAt: `${todayStr}T15:00:00`,
        },
      },
    ];
    setWorkOrders(mockWorkOrders);

    // 模擬可用零件
    const mockParts: InventoryItem[] = [
      { id: 'PART-001', partNumber: 'FILTER-001', name: '空調濾網', unitPrice: 500 },
      { id: 'PART-002', partNumber: 'CABLE-001', name: '網路線', unitPrice: 200 },
      { id: 'PART-003', partNumber: 'FUSE-001', name: '保險絲', unitPrice: 100 },
    ];
    setAvailableParts(mockParts);
  }, []);

  const handleOpenDetail = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setIsDetailOpen(true);
  };

  const handleStartWork = () => {
    if (!selectedWorkOrder) return;
    // TODO: 呼叫 API 更新工單狀態
    setWorkOrders(workOrders.map(wo => 
      wo.id === selectedWorkOrder.id 
        ? { ...wo, status: 'in_progress', actualStartTime: new Date().toISOString() }
        : wo
    ));
    setIsDetailOpen(false);
  };

  const handleCompleteWork = () => {
    setIsDetailOpen(false);
    setIsReportFormOpen(true);
  };

  const handleAddPart = (part: InventoryItem) => {
    const existingPart = partsUsed.find(p => p.itemId === part.id);
    if (existingPart) {
      setPartsUsed(partsUsed.map(p => 
        p.itemId === part.id 
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ));
    } else {
      setPartsUsed([...partsUsed, {
        itemId: part.id,
        itemName: part.name,
        quantity: 1,
        unitPrice: part.unitPrice,
      }]);
    }
  };

  const handleRemovePart = (itemId: string) => {
    setPartsUsed(partsUsed.filter(p => p.itemId !== itemId));
  };

  const handleUpdatePartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemovePart(itemId);
      return;
    }
    setPartsUsed(partsUsed.map(p => 
      p.itemId === itemId ? { ...p, quantity } : p
    ));
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setPhotos((prev) => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });

    // 重置 input，允許重複選擇同一檔案
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReport = () => {
    if (!selectedWorkOrder) return;
    // TODO: 呼叫 API 提交服務報告
    console.log('提交服務報告:', {
      workOrderId: selectedWorkOrder.id,
      hoursLogged: parseFloat(hoursLogged),
      summaryNotes,
      partsUsed,
      photos, // 照片陣列
      customerSignature: signatureData,
    });
    
    // 更新工單狀態
    setWorkOrders(workOrders.map(wo => 
      wo.id === selectedWorkOrder.id 
        ? { ...wo, status: 'completed', actualEndTime: new Date().toISOString() }
        : wo
    ));
    
    // 重置表單
    setHoursLogged('');
    setSummaryNotes('');
    setPartsUsed([]);
    setSignatureData('');
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
    setPhotos([]);
    setIsReportFormOpen(false);
  };

  const handleNavigate = (address: string) => {
    // 開啟 Google Maps 或 Apple Maps
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const getStatusBadge = (status: WorkOrder['status']) => {
    const statusConfig = {
      pending: { label: '待排程', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
      scheduled: { label: '已排程', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      dispatched: { label: '已派送', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      in_progress: { label: '進行中', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      completed: { label: '已完成', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      billed: { label: '已結帳', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // 根據選取的標籤過濾工單
  const getFilteredWorkOrders = () => {
    const now = new Date();
    let targetDate: Date;

    switch (activeTab) {
      case 'yesterday':
        targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() - 1);
        break;
      case 'tomorrow':
        targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + 1);
        break;
      case 'today':
      default:
        targetDate = now;
        break;
    }

    const targetDateStr = targetDate.toDateString();

    return workOrders.filter(wo => {
      if (!wo.scheduledStartTime) return false;
      const scheduledDate = new Date(wo.scheduledStartTime).toDateString();
      return scheduledDate === targetDateStr;
    });
  };

  const filteredWorkOrders = getFilteredWorkOrders();

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* 標題 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            我的工單任務
          </h1>
          {/* GPS 位置顯示 */}
          <div className="flex items-center gap-2 text-sm">
            {isGettingLocation ? (
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Navigation className="h-4 w-4 animate-spin" />
                <span>定位中...</span>
              </div>
            ) : gpsError ? (
              <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400">
                <MapPin className="h-4 w-4" />
                <span className="text-xs">{gpsError}</span>
              </div>
            ) : gpsLocation ? (
              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <MapPin className="h-4 w-4" />
                <div className="flex flex-col items-end">
                  <span className="text-xs font-medium">
                    {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
                  </span>
                  {gpsLocation.accuracy && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      準確度: ±{Math.round(gpsLocation.accuracy)}m
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {technicianName ? (
            <>Hi <span className="font-bold text-gray-700 dark:text-gray-300">{technicianName}</span> 您好，這是指派給您的任務</>
          ) : (
            <>查看並管理分配給您的工單</>
          )}
        </p>
      </div>

      {/* 日期標籤 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="yesterday">昨天</TabsTrigger>
          <TabsTrigger value="today">今天</TabsTrigger>
          <TabsTrigger value="tomorrow">明天</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          {filteredWorkOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>目前沒有工單</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredWorkOrders.map((workOrder) => (
                <Card 
                  key={workOrder.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOpenDetail(workOrder)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold">{workOrder.id}</span>
                          {getStatusBadge(workOrder.status)}
                          {workOrder.priority && (
                            <Badge className={
                              workOrder.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              workOrder.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                              workOrder.priority === 'medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }>
                              {workOrder.priority === 'urgent' ? '緊急' :
                               workOrder.priority === 'high' ? '高' :
                               workOrder.priority === 'medium' ? '中' : '低'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {workOrder.case?.title || '無標題'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {workOrder.customer?.name}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          {workOrder.scheduledStartTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(workOrder.scheduledStartTime).toLocaleTimeString('zh-TW', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {workOrder.customer?.address}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 工單詳情 Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              工單詳情
            </DialogTitle>
            <DialogDescription>
              {selectedWorkOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedWorkOrder && (
            <div className="space-y-4 mt-4">
              {/* 狀態與操作按鈕 */}
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedWorkOrder.status)}
                <div className="flex gap-2">
                  {selectedWorkOrder.status === 'dispatched' && (
                    <Button onClick={handleStartWork}>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      開始工作
                    </Button>
                  )}
                  {selectedWorkOrder.status === 'in_progress' && (
                    <Button onClick={handleCompleteWork}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      完工
                    </Button>
                  )}
                </div>
              </div>

              {/* 客戶資訊 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    客戶資訊
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-semibold">客戶名稱：</span>
                    {selectedWorkOrder.customer?.name}
                  </div>
                  {selectedWorkOrder.customer?.contactInfo.phone && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">電話：</span>
                      <a 
                        href={`tel:${selectedWorkOrder.customer.contactInfo.phone}`}
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Phone className="h-4 w-4" />
                        {selectedWorkOrder.customer.contactInfo.phone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 地址與導航 */}
              {selectedWorkOrder.customer?.address && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      服務地址
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-3">{selectedWorkOrder.customer.address}</p>
                    <Button
                      onClick={() => handleNavigate(selectedWorkOrder.customer!.address)}
                      className="w-full"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      開始導航
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* 問題描述 */}
              {selectedWorkOrder.case && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">問題描述</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold">標題：</span>
                        {selectedWorkOrder.case.title}
                      </div>
                      <div>
                        <span className="font-semibold">描述：</span>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {selectedWorkOrder.case.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 時間資訊 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    時間資訊
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {selectedWorkOrder.scheduledStartTime && (
                    <div>
                      <span className="font-semibold">預定開始：</span>
                      {new Date(selectedWorkOrder.scheduledStartTime).toLocaleString('zh-TW')}
                    </div>
                  )}
                  {selectedWorkOrder.scheduledEndTime && (
                    <div>
                      <span className="font-semibold">預定結束：</span>
                      {new Date(selectedWorkOrder.scheduledEndTime).toLocaleString('zh-TW')}
                    </div>
                  )}
                  {selectedWorkOrder.actualStartTime && (
                    <div>
                      <span className="font-semibold">實際開始：</span>
                      {new Date(selectedWorkOrder.actualStartTime).toLocaleString('zh-TW')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 服務報告表單 Modal */}
      <Dialog open={isReportFormOpen} onOpenChange={setIsReportFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>服務報告</DialogTitle>
            <DialogDescription>
              填寫服務完成報告
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* 工時記錄 */}
            <div>
              <Label htmlFor="hours">工時 (小時)</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0"
                value={hoursLogged}
                onChange={(e) => setHoursLogged(e.target.value)}
                placeholder="例如: 2.5"
              />
            </div>

            {/* 使用的零件 */}
            <div>
              <Label>使用的零件</Label>
              <div className="mt-2 space-y-2">
                {availableParts.map((part) => (
                  <div key={part.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="font-medium">{part.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({part.partNumber})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const existing = partsUsed.find(p => p.itemId === part.id);
                          if (existing) {
                            handleUpdatePartQuantity(part.id, existing.quantity - 1);
                          }
                        }}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">
                        {partsUsed.find(p => p.itemId === part.id)?.quantity || 0}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddPart(part)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {partsUsed.length > 0 && (
                <div className="mt-2 space-y-1">
                  {partsUsed.map((part) => (
                    <div key={part.itemId} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span>{part.itemName} x {part.quantity}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemovePart(part.itemId)}
                      >
                        移除
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 拍照功能 */}
            <div>
              <Label>現場照片</Label>
              <div className="mt-2 space-y-3">
                {/* 拍照按鈕 */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handlePhotoCapture}
                    className="hidden"
                    id="photo-input"
                  />
                  <Label htmlFor="photo-input" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Camera className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        拍照或選擇照片
                      </span>
                    </div>
                  </Label>
                </div>

                {/* 照片預覽 */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`現場照片 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          aria-label="刪除照片"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                可拍攝多張照片記錄現場狀況、設備狀態等
              </p>
            </div>

            {/* 工作總結 */}
            <div>
              <Label htmlFor="summary">工作總結</Label>
              <Textarea
                id="summary"
                value={summaryNotes}
                onChange={(e) => setSummaryNotes(e.target.value)}
                placeholder="請描述完成的工作內容..."
                rows={4}
              />
            </div>

            {/* 客戶簽名 */}
            <div>
              <Label>客戶簽名</Label>
              <div className="mt-2 space-y-2">
                {/* 簽名畫布 */}
                <div className="border-2 border-dashed rounded-lg bg-white dark:bg-gray-800 p-2">
                  <SignatureCanvas
                    ref={signatureCanvasRef}
                    canvasProps={{
                      width: 500,
                      height: 200,
                      className: 'signature-canvas',
                      style: {
                        width: '100%',
                        height: 'auto',
                        touchAction: 'none',
                        display: 'block',
                      },
                    }}
                    backgroundColor="#ffffff"
                    penColor="#000000"
                  />
                </div>
                
                {/* 操作按鈕 */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (signatureCanvasRef.current) {
                        signatureCanvasRef.current.clear();
                        setSignatureData('');
                      }
                    }}
                    className="flex-1"
                  >
                    <Eraser className="h-4 w-4 mr-2" />
                    清除
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (signatureCanvasRef.current && !signatureCanvasRef.current.isEmpty()) {
                        const dataURL = signatureCanvasRef.current.toDataURL('image/png');
                        setSignatureData(dataURL);
                      } else {
                        alert('請先簽名');
                      }
                    }}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    確認簽名
                  </Button>
                </div>
                
                {/* 簽名預覽 */}
                {signatureData && (
                  <div className="border rounded-lg p-2 bg-gray-50 dark:bg-gray-800">
                    <img src={signatureData} alt="客戶簽名" className="max-w-full max-h-[100px] mx-auto" />
                  </div>
                )}
              </div>
            </div>

            {/* 提交按鈕 */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReportFormOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmitReport}>
                提交報告
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

