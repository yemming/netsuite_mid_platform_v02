'use client';

import { useState, useEffect, useRef } from 'react';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LayoutDashboard, MapPin, Calendar, Users, Clock, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { WorkOrder, SchedulingSuggestion, User as UserType, Customer, Case } from '@/lib/field-operations-types';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';

// 動態導入 MapView 以避免 SSR 問題
const MapView = dynamic(
  () => import('@/components/field-operations/map-view').then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">載入地圖中...</div>,
  }
);

// 技術人員排程資料結構
interface TechnicianSchedule {
  technician: UserType;
  workOrders: WorkOrder[];
}

// 技術人員位置資料
interface TechnicianLocation {
  technicianId: string;
  technicianName: string;
  latitude: number;
  longitude: number;
  status: 'online' | 'offline';
  currentWorkOrder?: string;
}

export default function DispatchPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [suggestions, setSuggestions] = useState<SchedulingSuggestion[]>([]);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [isWorkOrderDetailOpen, setIsWorkOrderDetailOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [viewMode, setViewMode] = useState<'gantt' | 'map' | 'split'>('split');
  const [technicianSchedules, setTechnicianSchedules] = useState<TechnicianSchedule[]>([]);
  const [technicianLocations, setTechnicianLocations] = useState<TechnicianLocation[]>([]);
  const [technicians, setTechnicians] = useState<UserType[]>([]);
  const [ganttZoom, setGanttZoom] = useState(1); // 甘特圖縮放比例
  const [ganttScrollLeft, setGanttScrollLeft] = useState(0); // 甘特圖水平滾動位置
  const [focusTechnicianId, setFocusTechnicianId] = useState<string | undefined>(undefined); // 要聚焦的技術人員 ID
  const ganttHeaderRef = useRef<HTMLDivElement>(null);
  const ganttRowsRef = useRef<HTMLDivElement[]>([]);

  // 從 Supabase 載入第一筆人員資料，然後載入模擬資料
  useEffect(() => {
    const loadData = async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      let firstTechnician: UserType | null = null;
      let firstLocation: TechnicianLocation | null = null;
      
      // 1. 先從 Supabase 載入第一筆人員資料
      try {
        const supabase = createClient();
        
        // 使用 RPC 函數取得第一筆人員資料（包含 auth.users 的 name 和 email，以及 user_profiles 的 avatar）
        const { data: personnelData, error } = await supabase.rpc('get_personnel_with_user_info', {
          p_role: null,
          p_status: null,
          p_search: null,
        });

        if (!error && personnelData && personnelData.length > 0) {
          // 取得第一筆資料
          const firstPerson = personnelData[0];
          
          // 轉換為 UserType 格式
          firstTechnician = {
            id: firstPerson.personnel_id || firstPerson.id,
            name: firstPerson.name || '未命名',
            email: firstPerson.email || '',
            role: firstPerson.role as 'technician' | 'dispatcher' | 'admin',
            skills: firstPerson.skills || [],
            status: firstPerson.status as 'online' | 'offline',
            avatar: firstPerson.avatar || undefined,
          };

          // 建立技術人員位置資料（如果有 GPS 位置）
          if (firstPerson.location && firstPerson.location.latitude && firstPerson.location.longitude) {
            firstLocation = {
              technicianId: firstTechnician.id,
              technicianName: firstTechnician.name,
              latitude: firstPerson.location.latitude,
              longitude: firstPerson.location.longitude,
              status: firstTechnician.status,
              avatar: firstTechnician.avatar,
            };
          } else {
            // 如果沒有 GPS 位置，使用預設位置（台北市中心）
            firstLocation = {
              technicianId: firstTechnician.id,
              technicianName: firstTechnician.name,
              latitude: 25.0330,
              longitude: 121.5654,
              status: firstTechnician.status,
              avatar: firstTechnician.avatar,
            };
          }
        }
      } catch (err) {
        console.error('載入人員資料錯誤:', err);
      }

      // 2. 載入模擬資料（技術人員）
      const mockTechs: UserType[] = [
        {
          id: 'TECH-002',
          name: '索隆',
          email: 'zoro@example.com',
          role: 'technician',
          skills: ['網路設備', '監控系統'],
          status: 'online',
        },
        {
          id: 'TECH-003',
          name: '香吉士',
          email: 'sanji@example.com',
          role: 'technician',
          skills: ['智慧家電', '門禁系統'],
          status: 'online',
        },
        {
          id: 'TECH-004',
          name: '佛朗基',
          email: 'franky@example.com',
          role: 'technician',
          skills: ['空調維修', '太陽能'],
          status: 'offline',
        },
        {
          id: 'TECH-005',
          name: '娜美',
          email: 'nami@example.com',
          role: 'technician',
          skills: ['智慧家電', '監控系統'],
          status: 'online',
        },
        {
          id: 'TECH-006',
          name: '羅賓',
          email: 'robin@example.com',
          role: 'technician',
          skills: ['網路設備', '電氣'],
          status: 'online',
        },
        {
          id: 'TECH-007',
          name: '喬巴',
          email: 'chopper@example.com',
          role: 'technician',
          skills: ['門禁系統', '空調維修'],
          status: 'online',
        },
        {
          id: 'TECH-008',
          name: '布魯克',
          email: 'brook@example.com',
          role: 'technician',
          skills: ['電氣', '網路設備'],
          status: 'online',
        },
        {
          id: 'TECH-009',
          name: '甚平',
          email: 'jinbe@example.com',
          role: 'technician',
          skills: ['空調維修', '太陽能'],
          status: 'online',
        },
        {
          id: 'TECH-010',
          name: '騙人布',
          email: 'usopp@example.com',
          role: 'technician',
          skills: ['監控系統', '智慧家電'],
          status: 'online',
        },
        {
          id: 'TECH-011',
          name: '羅',
          email: 'law@example.com',
          role: 'technician',
          skills: ['網路設備', '電氣'],
          status: 'online',
        },
        {
          id: 'TECH-012',
          name: '大和',
          email: 'yamato@example.com',
          role: 'technician',
          skills: ['門禁系統', '監控系統'],
          status: 'online',
        },
      ];

      // 合併技術人員資料（第一筆從 DB，後面是模擬資料）
      const allTechnicians = firstTechnician 
        ? [firstTechnician, ...mockTechs]
        : mockTechs;
      setTechnicians(allTechnicians);

      // 3. 載入模擬工單資料
      // 如果第一筆技術人員存在，使用第一筆的 ID；否則使用 TECH-001
      const firstTechId = firstTechnician ? firstTechnician.id : 'TECH-001';
      
      const mockWorkOrders: WorkOrder[] = [
      // 待排程工單
      {
        id: 'WO-001',
        caseId: 'CASE-001',
        status: 'pending',
        priority: 'high',
        slaDeadline: `${todayStr}T14:00:00`,
        customer: {
          id: 'CUST-001',
          name: 'ABC 公司',
          address: '台北市信義區信義路五段7號',
          contactInfo: { phone: '02-1234-5678' },
        },
        case: {
          id: 'CASE-001',
          title: '空調系統故障緊急維修',
          description: '辦公室空調無法運轉，需要緊急處理',
          customerId: 'CUST-001',
          status: 'open',
          createdAt: `${todayStr}T08:00:00`,
          updatedAt: `${todayStr}T08:00:00`,
        },
      },
      {
        id: 'WO-002',
        caseId: 'CASE-002',
        status: 'pending',
        priority: 'urgent',
        slaDeadline: `${todayStr}T16:00:00`,
        customer: {
          id: 'CUST-002',
          name: '科技大樓管理處',
          address: '台北市大安區敦化南路二段216號',
          contactInfo: { phone: '02-2345-6789' },
        },
        case: {
          id: 'CASE-002',
          title: '電梯故障緊急維修',
          description: 'B棟電梯無法正常運作，影響上下班',
          customerId: 'CUST-002',
          status: 'open',
          createdAt: `${todayStr}T09:00:00`,
          updatedAt: `${todayStr}T09:00:00`,
        },
      },
      {
        id: 'WO-003',
        caseId: 'CASE-003',
        status: 'pending',
        priority: 'medium',
        slaDeadline: `${todayStr}T18:00:00`,
        customer: {
          id: 'CUST-003',
          name: '綠能科技公司',
          address: '新北市中和區中正路888號',
          contactInfo: { phone: '02-3456-7890' },
        },
        case: {
          id: 'CASE-003',
          title: '太陽能板清潔維護',
          description: '定期清潔太陽能板並檢查系統運作狀況',
          customerId: 'CUST-003',
          status: 'open',
          createdAt: `${todayStr}T10:00:00`,
          updatedAt: `${todayStr}T10:00:00`,
        },
      },
      {
        id: 'WO-004',
        caseId: 'CASE-004',
        status: 'pending',
        priority: 'low',
        slaDeadline: `${todayStr}T20:00:00`,
        customer: {
          id: 'CUST-004',
          name: '智慧家居展示中心',
          address: '台北市內湖區瑞光路258號',
          contactInfo: { phone: '02-4567-8901' },
        },
        case: {
          id: 'CASE-004',
          title: '智慧家電系統設定',
          description: '協助客戶設定新的智慧家電系統',
          customerId: 'CUST-004',
          status: 'open',
          createdAt: `${todayStr}T11:00:00`,
          updatedAt: `${todayStr}T11:00:00`,
        },
      },
      {
        id: 'WO-005',
        caseId: 'CASE-005',
        status: 'pending',
        priority: 'high',
        slaDeadline: `${todayStr}T15:00:00`,
        customer: {
          id: 'CUST-005',
          name: '國際貿易大樓',
          address: '台北市松山區南京東路三段200號',
          contactInfo: { phone: '02-5678-9012' },
        },
        case: {
          id: 'CASE-005',
          title: '中央空調系統年度保養',
          description: '執行中央空調系統年度保養作業',
          customerId: 'CUST-005',
          status: 'open',
          createdAt: `${todayStr}T12:00:00`,
          updatedAt: `${todayStr}T12:00:00`,
        },
      },
      {
        id: 'WO-006',
        caseId: 'CASE-006',
        status: 'pending',
        priority: 'medium',
        slaDeadline: `${todayStr}T17:00:00`,
        customer: {
          id: 'CUST-006',
          name: '創新園區管理委員會',
          address: '新竹市東區光復路二段101號',
          contactInfo: { phone: '03-1234-5678' },
        },
        case: {
          id: 'CASE-006',
          title: '監控系統升級',
          description: '升級園區監控系統，安裝新的攝影機',
          customerId: 'CUST-006',
          status: 'open',
          createdAt: `${todayStr}T13:00:00`,
          updatedAt: `${todayStr}T13:00:00`,
        },
      },
      // 已排程工單（用於甘特圖）
      {
        id: 'WO-007',
        caseId: 'CASE-007',
        status: 'scheduled',
        technicianId: 'TECH-001',
        scheduledStartTime: `${todayStr}T09:00:00`,
        scheduledEndTime: `${todayStr}T10:30:00`,
        priority: 'medium',
        customer: {
          id: 'CUST-007',
          name: 'XYZ 企業',
          address: '新北市板橋區文化路一段188巷',
          contactInfo: { phone: '02-9876-5432' },
        },
        case: {
          id: 'CASE-007',
          title: '網路設備定期檢查',
          description: '定期維護檢查',
          customerId: 'CUST-007',
          status: 'open',
          createdAt: `${todayStr}T08:00:00`,
          updatedAt: `${todayStr}T08:00:00`,
        },
      },
      {
        id: 'WO-008',
        caseId: 'CASE-008',
        status: 'in_progress',
        technicianId: 'TECH-001',
        scheduledStartTime: `${todayStr}T13:00:00`,
        scheduledEndTime: `${todayStr}T14:30:00`,
        actualStartTime: `${todayStr}T13:15:00`,
        priority: 'high',
        customer: {
          id: 'CUST-008',
          name: '社區管理委員會',
          address: '桃園市中壢區中正路123號',
          contactInfo: { phone: '03-2345-6789' },
        },
        case: {
          id: 'CASE-008',
          title: '門禁系統故障排除',
          description: '社區門禁系統無法正常運作',
          customerId: 'CUST-008',
          status: 'open',
          createdAt: `${todayStr}T10:00:00`,
          updatedAt: `${todayStr}T13:15:00`,
        },
      },
      {
        id: 'WO-009',
        caseId: 'CASE-009',
        status: 'scheduled',
        technicianId: 'TECH-002',
        scheduledStartTime: `${todayStr}T10:00:00`,
        scheduledEndTime: `${todayStr}T11:30:00`,
        priority: 'medium',
        customer: {
          id: 'CUST-009',
          name: '智慧辦公大樓',
          address: '台北市中山區民生東路三段100號',
          contactInfo: { phone: '02-1111-2222' },
        },
        case: {
          id: 'CASE-009',
          title: '監控系統維護',
          description: '監控系統定期維護',
          customerId: 'CUST-009',
          status: 'open',
          createdAt: `${todayStr}T09:00:00`,
          updatedAt: `${todayStr}T09:00:00`,
        },
      },
      {
        id: 'WO-010',
        caseId: 'CASE-010',
        status: 'dispatched',
        technicianId: 'TECH-002',
        scheduledStartTime: `${todayStr}T14:00:00`,
        scheduledEndTime: `${todayStr}T15:30:00`,
        priority: 'low',
        customer: {
          id: 'CUST-010',
          name: '商業大樓',
          address: '新北市新店區中興路三段1號',
          contactInfo: { phone: '02-3333-4444' },
        },
        case: {
          id: 'CASE-010',
          title: '網路設備升級',
          description: '網路設備升級作業',
          customerId: 'CUST-010',
          status: 'open',
          createdAt: `${todayStr}T11:00:00`,
          updatedAt: `${todayStr}T11:00:00`,
        },
      },
      {
        id: 'WO-011',
        caseId: 'CASE-011',
        status: 'scheduled',
        technicianId: 'TECH-003',
        scheduledStartTime: `${todayStr}T11:00:00`,
        scheduledEndTime: `${todayStr}T12:30:00`,
        priority: 'medium',
        customer: {
          id: 'CUST-011',
          name: '住宅社區',
          address: '台北市文山區木柵路一段100號',
          contactInfo: { phone: '02-5555-6666' },
        },
        case: {
          id: 'CASE-011',
          title: '智慧家電安裝',
          description: '安裝智慧家電系統',
          customerId: 'CUST-011',
          status: 'open',
          createdAt: `${todayStr}T10:00:00`,
          updatedAt: `${todayStr}T10:00:00`,
        },
      },
      // 娜美的工單（使用不同狀態）
      {
        id: 'WO-012',
        caseId: 'CASE-012',
        status: 'scheduled', // 藍色 - 已排程
        technicianId: 'TECH-005',
        scheduledStartTime: `${todayStr}T09:00:00`,
        scheduledEndTime: `${todayStr}T10:30:00`,
        priority: 'medium',
        customer: {
          id: 'CUST-012',
          name: '科技園區',
          address: '新竹市東區科學園區',
          contactInfo: { phone: '03-7777-8888' },
        },
        case: {
          id: 'CASE-012',
          title: '智慧家電系統設定',
          description: '設定智慧家電系統',
          customerId: 'CUST-012',
          status: 'open',
          createdAt: `${todayStr}T08:00:00`,
          updatedAt: `${todayStr}T08:00:00`,
        },
      },
      {
        id: 'WO-013',
        caseId: 'CASE-013',
        status: 'dispatched', // 黃色 - 已派送
        technicianId: 'TECH-005',
        scheduledStartTime: `${todayStr}T13:00:00`,
        scheduledEndTime: `${todayStr}T14:30:00`,
        priority: 'high',
        customer: {
          id: 'CUST-013',
          name: '智慧大樓',
          address: '台北市信義區信義路五段',
          contactInfo: { phone: '02-9999-0000' },
        },
        case: {
          id: 'CASE-013',
          title: '監控系統升級',
          description: '升級監控系統設備',
          customerId: 'CUST-013',
          status: 'open',
          createdAt: `${todayStr}T09:00:00`,
          updatedAt: `${todayStr}T09:00:00`,
        },
      },
      // 羅賓的工單
      {
        id: 'WO-014',
        caseId: 'CASE-014',
        status: 'in_progress', // 橘色 - 進行中
        technicianId: 'TECH-006',
        scheduledStartTime: `${todayStr}T10:00:00`,
        scheduledEndTime: `${todayStr}T11:30:00`,
        actualStartTime: `${todayStr}T10:10:00`,
        priority: 'urgent',
        customer: {
          id: 'CUST-014',
          name: '金融大樓',
          address: '台北市松山區南京東路',
          contactInfo: { phone: '02-1111-3333' },
        },
        case: {
          id: 'CASE-014',
          title: '網路設備緊急維修',
          description: '網路設備故障緊急處理',
          customerId: 'CUST-014',
          status: 'open',
          createdAt: `${todayStr}T09:30:00`,
          updatedAt: `${todayStr}T10:10:00`,
        },
      },
      {
        id: 'WO-015',
        caseId: 'CASE-015',
        status: 'completed', // 綠色 - 已完成
        technicianId: 'TECH-006',
        scheduledStartTime: `${todayStr}T14:00:00`,
        scheduledEndTime: `${todayStr}T15:30:00`,
        actualStartTime: `${todayStr}T14:00:00`,
        actualEndTime: `${todayStr}T16:45:00`,
        priority: 'medium',
        customer: {
          id: 'CUST-015',
          name: '企業總部',
          address: '台北市大安區敦化南路',
          contactInfo: { phone: '02-2222-4444' },
        },
        case: {
          id: 'CASE-015',
          title: '電氣系統檢查',
          description: '電氣系統定期檢查',
          customerId: 'CUST-015',
          status: 'open',
          createdAt: `${todayStr}T08:00:00`,
          updatedAt: `${todayStr}T16:45:00`,
        },
      },
      // 喬巴的工單
      {
        id: 'WO-016',
        caseId: 'CASE-016',
        status: 'scheduled', // 藍色 - 已排程
        technicianId: 'TECH-007',
        scheduledStartTime: `${todayStr}T11:00:00`,
        scheduledEndTime: `${todayStr}T12:30:00`,
        priority: 'medium',
        customer: {
          id: 'CUST-016',
          name: '醫療中心',
          address: '台北市內湖區成功路',
          contactInfo: { phone: '02-3333-5555' },
        },
        case: {
          id: 'CASE-016',
          title: '門禁系統維護',
          description: '門禁系統定期維護',
          customerId: 'CUST-016',
          status: 'open',
          createdAt: `${todayStr}T09:00:00`,
          updatedAt: `${todayStr}T09:00:00`,
        },
      },
      {
        id: 'WO-017',
        caseId: 'CASE-017',
        status: 'dispatched', // 黃色 - 已派送
        technicianId: 'TECH-007',
        scheduledStartTime: `${todayStr}T15:00:00`,
        scheduledEndTime: `${todayStr}T16:30:00`,
        priority: 'low',
        customer: {
          id: 'CUST-017',
          name: '住宅大樓',
          address: '新北市板橋區文化路',
          contactInfo: { phone: '02-4444-6666' },
        },
        case: {
          id: 'CASE-017',
          title: '空調系統保養',
          description: '空調系統定期保養',
          customerId: 'CUST-017',
          status: 'open',
          createdAt: `${todayStr}T10:00:00`,
          updatedAt: `${todayStr}T10:00:00`,
        },
      },
      // 布魯克的工單
      {
        id: 'WO-018',
        caseId: 'CASE-018',
        status: 'scheduled',
        technicianId: 'TECH-008',
        scheduledStartTime: `${todayStr}T10:00:00`,
        scheduledEndTime: `${todayStr}T11:30:00`,
        priority: 'medium',
        customer: {
          id: 'CUST-018',
          name: '音樂廳',
          address: '台北市中山區民生東路',
          contactInfo: { phone: '02-5555-7777' },
        },
        case: {
          id: 'CASE-018',
          title: '電氣系統檢查',
          description: '電氣系統定期檢查',
          customerId: 'CUST-018',
          status: 'open',
          createdAt: `${todayStr}T09:00:00`,
          updatedAt: `${todayStr}T09:00:00`,
        },
      },
      {
        id: 'WO-019',
        caseId: 'CASE-019',
        status: 'dispatched',
        technicianId: 'TECH-008',
        scheduledStartTime: `${todayStr}T14:00:00`,
        scheduledEndTime: `${todayStr}T15:30:00`,
        priority: 'low',
        customer: {
          id: 'CUST-019',
          name: '網路公司',
          address: '新北市中和區中正路',
          contactInfo: { phone: '02-6666-8888' },
        },
        case: {
          id: 'CASE-019',
          title: '網路設備維護',
          description: '網路設備定期維護',
          customerId: 'CUST-019',
          status: 'open',
          createdAt: `${todayStr}T10:00:00`,
          updatedAt: `${todayStr}T10:00:00`,
        },
      },
      // 甚平的工單
      {
        id: 'WO-020',
        caseId: 'CASE-020',
        status: 'in_progress',
        technicianId: 'TECH-009',
        scheduledStartTime: `${todayStr}T09:00:00`,
        scheduledEndTime: `${todayStr}T10:30:00`,
        actualStartTime: `${todayStr}T09:05:00`,
        priority: 'high',
        customer: {
          id: 'CUST-020',
          name: '海洋中心',
          address: '基隆市信義區中正路',
          contactInfo: { phone: '02-7777-9999' },
        },
        case: {
          id: 'CASE-020',
          title: '空調系統維修',
          description: '空調系統故障維修',
          customerId: 'CUST-020',
          status: 'open',
          createdAt: `${todayStr}T08:00:00`,
          updatedAt: `${todayStr}T09:05:00`,
        },
      },
      {
        id: 'WO-021',
        caseId: 'CASE-021',
        status: 'completed',
        technicianId: 'TECH-009',
        scheduledStartTime: `${todayStr}T13:00:00`,
        scheduledEndTime: `${todayStr}T14:30:00`,
        actualStartTime: `${todayStr}T13:00:00`,
        actualEndTime: `${todayStr}T15:50:00`,
        priority: 'medium',
        customer: {
          id: 'CUST-021',
          name: '太陽能發電廠',
          address: '桃園市大園區',
          contactInfo: { phone: '03-8888-0000' },
        },
        case: {
          id: 'CASE-021',
          title: '太陽能系統檢查',
          description: '太陽能系統定期檢查',
          customerId: 'CUST-021',
          status: 'open',
          createdAt: `${todayStr}T08:00:00`,
          updatedAt: `${todayStr}T15:50:00`,
        },
      },
      // 騙人布的工單
      {
        id: 'WO-022',
        caseId: 'CASE-022',
        status: 'scheduled',
        technicianId: 'TECH-010',
        scheduledStartTime: `${todayStr}T11:00:00`,
        scheduledEndTime: `${todayStr}T12:30:00`,
        priority: 'medium',
        customer: {
          id: 'CUST-022',
          name: '科技公司',
          address: '新竹市東區光復路',
          contactInfo: { phone: '03-9999-1111' },
        },
        case: {
          id: 'CASE-022',
          title: '監控系統安裝',
          description: '安裝新的監控系統',
          customerId: 'CUST-022',
          status: 'open',
          createdAt: `${todayStr}T09:00:00`,
          updatedAt: `${todayStr}T09:00:00`,
        },
      },
      {
        id: 'WO-023',
        caseId: 'CASE-023',
        status: 'dispatched',
        technicianId: 'TECH-010',
        scheduledStartTime: `${todayStr}T15:00:00`,
        scheduledEndTime: `${todayStr}T16:30:00`,
        priority: 'low',
        customer: {
          id: 'CUST-023',
          name: '智慧住宅',
          address: '台北市士林區天母',
          contactInfo: { phone: '02-0000-2222' },
        },
        case: {
          id: 'CASE-023',
          title: '智慧家電設定',
          description: '設定智慧家電系統',
          customerId: 'CUST-023',
          status: 'open',
          createdAt: `${todayStr}T10:00:00`,
          updatedAt: `${todayStr}T10:00:00`,
        },
      },
      // 羅的工單
      {
        id: 'WO-024',
        caseId: 'CASE-024',
        status: 'in_progress',
        technicianId: 'TECH-011',
        scheduledStartTime: `${todayStr}T10:00:00`,
        scheduledEndTime: `${todayStr}T11:30:00`,
        actualStartTime: `${todayStr}T10:15:00`,
        priority: 'urgent',
        customer: {
          id: 'CUST-024',
          name: '醫院',
          address: '台北市大安區仁愛路',
          contactInfo: { phone: '02-1111-3333' },
        },
        case: {
          id: 'CASE-024',
          title: '網路設備緊急維修',
          description: '醫院網路設備故障',
          customerId: 'CUST-024',
          status: 'open',
          createdAt: `${todayStr}T09:30:00`,
          updatedAt: `${todayStr}T10:15:00`,
        },
      },
      {
        id: 'WO-025',
        caseId: 'CASE-025',
        status: 'completed',
        technicianId: 'TECH-011',
        scheduledStartTime: `${todayStr}T14:00:00`,
        scheduledEndTime: `${todayStr}T15:30:00`,
        actualStartTime: `${todayStr}T14:00:00`,
        actualEndTime: `${todayStr}T16:30:00`,
        priority: 'medium',
        customer: {
          id: 'CUST-025',
          name: '企業大樓',
          address: '台北市信義區松仁路',
          contactInfo: { phone: '02-2222-4444' },
        },
        case: {
          id: 'CASE-025',
          title: '電氣系統檢查',
          description: '電氣系統定期檢查',
          customerId: 'CUST-025',
          status: 'open',
          createdAt: `${todayStr}T08:00:00`,
          updatedAt: `${todayStr}T16:30:00`,
        },
      },
      // 大和的工單
      {
        id: 'WO-026',
        caseId: 'CASE-026',
        status: 'scheduled',
        technicianId: 'TECH-012',
        scheduledStartTime: `${todayStr}T09:00:00`,
        scheduledEndTime: `${todayStr}T10:30:00`,
        priority: 'high',
        customer: {
          id: 'CUST-026',
          name: '保全公司',
          address: '台北市內湖區瑞光路',
          contactInfo: { phone: '02-3333-5555' },
        },
        case: {
          id: 'CASE-026',
          title: '門禁系統升級',
          description: '升級門禁系統',
          customerId: 'CUST-026',
          status: 'open',
          createdAt: `${todayStr}T08:00:00`,
          updatedAt: `${todayStr}T08:00:00`,
        },
      },
      {
        id: 'WO-027',
        caseId: 'CASE-027',
        status: 'dispatched',
        technicianId: 'TECH-012',
        scheduledStartTime: `${todayStr}T13:00:00`,
        scheduledEndTime: `${todayStr}T14:30:00`,
        priority: 'medium',
        customer: {
          id: 'CUST-027',
          name: '商業大樓',
          address: '新北市新莊區中正路',
          contactInfo: { phone: '02-4444-6666' },
        },
        case: {
          id: 'CASE-027',
          title: '監控系統維護',
          description: '監控系統定期維護',
          customerId: 'CUST-027',
          status: 'open',
          createdAt: `${todayStr}T09:00:00`,
          updatedAt: `${todayStr}T09:00:00`,
        },
      },
    ];
    setWorkOrders(mockWorkOrders);

      // 4. 建立技術人員排程資料
      const schedules: TechnicianSchedule[] = allTechnicians.map(tech => ({
        technician: tech,
        workOrders: mockWorkOrders.filter(wo => wo.technicianId === tech.id),
      }));
      setTechnicianSchedules(schedules);

      // 5. 建立技術人員位置資料（第一筆從 DB，其他是模擬資料）
      const locations: TechnicianLocation[] = [];
      
      // 加入第一筆技術人員的位置（如果存在）
      if (firstLocation) {
        // 找出第一筆技術人員的工單
        const firstTechWorkOrders = mockWorkOrders.filter(wo => wo.technicianId === firstTechId);
        const currentWorkOrder = firstTechWorkOrders.find(wo => 
          wo.status === 'in_progress' || wo.status === 'dispatched'
        );
        locations.push({
          ...firstLocation,
          currentWorkOrder: currentWorkOrder?.id,
        });
      }
      
      // 加入模擬技術人員的位置
      const mockLocations: TechnicianLocation[] = [
      {
        technicianId: 'TECH-002',
        technicianName: '索隆',
        latitude: 25.0143,
        longitude: 121.4637,
        status: 'online',
        currentWorkOrder: 'WO-010',
      },
      {
        technicianId: 'TECH-003',
        technicianName: '香吉士',
        latitude: 24.9896,
        longitude: 121.5395,
        status: 'online',
        currentWorkOrder: 'WO-011',
      },
      {
        technicianId: 'TECH-004',
        technicianName: '佛朗基',
        latitude: 25.0479,
        longitude: 121.5318,
        status: 'offline',
      },
      {
        technicianId: 'TECH-005',
        technicianName: '娜美',
        latitude: 25.0400,
        longitude: 121.5700,
        status: 'online',
        currentWorkOrder: 'WO-013',
      },
      {
        technicianId: 'TECH-006',
        technicianName: '羅賓',
        latitude: 25.0200,
        longitude: 121.5400,
        status: 'online',
        currentWorkOrder: 'WO-014',
      },
      {
        technicianId: 'TECH-007',
        technicianName: '喬巴',
        latitude: 25.0260,
        longitude: 121.5500,
        status: 'online',
        currentWorkOrder: 'WO-017',
      },
      {
        technicianId: 'TECH-008',
        technicianName: '布魯克',
        latitude: 25.0300,
        longitude: 121.5600,
        status: 'online',
        currentWorkOrder: 'WO-019',
      },
      {
        technicianId: 'TECH-009',
        technicianName: '甚平',
        latitude: 25.0150,
        longitude: 121.5450,
        status: 'online',
        currentWorkOrder: 'WO-020',
      },
      {
        technicianId: 'TECH-010',
        technicianName: '騙人布',
        latitude: 25.0350,
        longitude: 121.5550,
        status: 'online',
        currentWorkOrder: 'WO-023',
      },
      {
        technicianId: 'TECH-011',
        technicianName: '羅',
        latitude: 25.0250,
        longitude: 121.5350,
        status: 'online',
        currentWorkOrder: 'WO-024',
      },
      {
        technicianId: 'TECH-012',
        technicianName: '大和',
        latitude: 25.0450,
        longitude: 121.5250,
        status: 'online',
        currentWorkOrder: 'WO-027',
      },
      ];
      
      // 合併所有位置資料
      const allLocations = [...locations, ...mockLocations];
      setTechnicianLocations(allLocations);
    };

    loadData();
  }, []);

  // 當工單列表改變時，自動更新技術人員排程（用於甘特圖顯示）
  useEffect(() => {
    // 從技術人員列表重新建立排程資料
    const updatedSchedules = technicians.map(tech => ({
      technician: tech,
      workOrders: workOrders.filter(wo => 
        wo.technicianId === tech.id && 
        (wo.status === 'scheduled' || wo.status === 'dispatched' || wo.status === 'in_progress' || wo.status === 'completed')
      ),
    }));
    setTechnicianSchedules(updatedSchedules);
  }, [workOrders, technicians]);

  const handleGetSuggestions = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    // TODO: 呼叫 API 取得建議
    const mockSuggestions: SchedulingSuggestion[] = [
      {
        technicianId: 'TECH-001',
        technicianName: '魯夫',
        reasons: ['最近', '有空', '技能相符'],
        score: 95,
      },
      {
        technicianId: 'TECH-002',
        technicianName: '索隆',
        reasons: ['有空', '技能相符'],
        score: 80,
      },
      {
        technicianId: 'TECH-003',
        technicianName: '香吉士',
        reasons: ['技能相符'],
        score: 70,
      },
    ];
    setSuggestions(mockSuggestions);
    setIsSuggestionModalOpen(true);
  };

  const handleAssignWorkOrder = (workOrderId: string, technicianId: string) => {
    // TODO: 呼叫 API 指派工單
    console.log('指派工單:', workOrderId, '給技術人員:', technicianId);
    
    // 找到要指派的工單
    const workOrder = workOrders.find(wo => wo.id === workOrderId);
    if (!workOrder) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // 找到該技術人員現有的所有已排程工單
    const technicianWorkOrders = workOrders.filter(wo => 
      wo.technicianId === technicianId && 
      wo.status !== 'pending' && 
      wo.scheduledEndTime
    );

    // 找到最晚的結束時間
    let latestEndTime: Date | null = null;
    if (technicianWorkOrders.length > 0) {
      latestEndTime = technicianWorkOrders.reduce((latest, wo) => {
        if (!wo.scheduledEndTime) return latest;
        const endTime = new Date(wo.scheduledEndTime);
        return !latest || endTime > latest ? endTime : latest;
      }, null as Date | null);
    }

    // 計算新工單的開始時間
    let startTime: Date;
    if (latestEndTime) {
      // 如果有現有工單，在最晚結束時間後加30分鐘
      startTime = new Date(latestEndTime.getTime() + 30 * 60 * 1000);
    } else {
      // 如果沒有現有工單，從今天上午9點開始
      startTime = new Date(`${today}T09:00:00`);
    }

    // 預設工時 1.5 小時
    const duration = 1.5;
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

    const scheduledStartTime = startTime.toISOString();
    const scheduledEndTime = endTime.toISOString();

    // 更新工單狀態
    const updatedWorkOrder: WorkOrder = {
      ...workOrder,
      status: 'scheduled',
      technicianId,
      scheduledStartTime,
      scheduledEndTime,
    };

    // 更新工單列表（useEffect 會自動更新甘特圖）
    const updatedWorkOrders = workOrders.map(wo => 
      wo.id === workOrderId ? updatedWorkOrder : wo
    );
    setWorkOrders(updatedWorkOrders);

    // 關閉 Modal
    setIsSuggestionModalOpen(false);
    setSelectedWorkOrder(null);
  };

  // 保存工單修改
  const handleSaveWorkOrder = (updatedWorkOrder: WorkOrder) => {
    // TODO: 呼叫 API 更新工單
    console.log('更新工單:', updatedWorkOrder);
    
    // 更新工單列表
    const updatedWorkOrders = workOrders.map(wo => 
      wo.id === updatedWorkOrder.id ? updatedWorkOrder : wo
    );
    setWorkOrders(updatedWorkOrders);
    
    // 更新技術人員排程（如果工單有技術人員）
    if (updatedWorkOrder.technicianId) {
      setTechnicianSchedules(prev => {
        return prev.map(schedule => {
          if (schedule.technician.id === updatedWorkOrder.technicianId) {
            return {
              ...schedule,
              workOrders: schedule.workOrders.map(wo => 
                wo.id === updatedWorkOrder.id ? updatedWorkOrder : wo
              ),
            };
          }
          return schedule;
        });
      });
    }
    
    // 關閉 Dialog
    setIsWorkOrderDetailOpen(false);
    setEditingWorkOrder(null);
  };

  const getStatusBadge = (status: WorkOrder['status']) => {
    const statusConfig = {
      pending: { label: '待排程', variant: 'default' as const },
      scheduled: { label: '已排程', variant: 'default' as const },
      dispatched: { label: '已派送', variant: 'default' as const },
      in_progress: { label: '進行中', variant: 'default' as const },
      completed: { label: '已完成', variant: 'default' as const },
      billed: { label: '已結帳', variant: 'default' as const },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority?: WorkOrder['priority']) => {
    if (!priority) return null;
    const priorityConfig = {
      low: { label: '低', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
      medium: { label: '中', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      high: { label: '高', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      urgent: { label: '緊急', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    };
    const config = priorityConfig[priority];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // 計算時間軸位置（簡化版甘特圖，支援縮放）
  const calculateTimePosition = (timeStr: string, startHour: number = 8, endHour: number = 18) => {
    const date = new Date(timeStr);
    const hour = date.getHours() + date.getMinutes() / 60;
    const totalHours = endHour - startHour;
    const position = ((hour - startHour) / totalHours) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // 小時
    return diff;
  };

  // 甘特圖縮放控制
  const handleZoomIn = () => {
    setGanttZoom(prev => Math.min(prev + 0.2, 3)); // 最大3倍
  };

  const handleZoomOut = () => {
    setGanttZoom(prev => Math.max(prev - 0.2, 0.5)); // 最小0.5倍
  };

  // 處理甘特圖水平滾動（同步所有滾動容器）
  const handleGanttScroll = (scrollLeft: number, sourceElement?: HTMLDivElement) => {
    setGanttScrollLeft(scrollLeft);
    // 同步時間軸標題的滾動
    if (ganttHeaderRef.current && ganttHeaderRef.current !== sourceElement) {
      ganttHeaderRef.current.scrollLeft = scrollLeft;
    }
    // 同步技術人員列表容器的水平滾動
    if (ganttRowsRef.current.length > 0 && ganttRowsRef.current[0] && ganttRowsRef.current[0] !== sourceElement) {
      ganttRowsRef.current[0].scrollLeft = scrollLeft;
    }
  };

  // 渲染甘特圖
  const renderGanttChart = () => {
    const startHour = 9; // 從9點開始
    const endHour = 22; // 擴展到22點結束
    const totalHours = endHour - startHour;
    const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);
    const hourWidth = 100 * ganttZoom; // 每小時的寬度（像素）
    const technicianNameWidth = 120; // 技術人員名稱區域寬度

    return (
      <div className="space-y-0 flex flex-col h-full">
        {/* 時間軸標題（可滾動） */}
        <div 
          className="flex border-b pb-0.5 mb-0.5 overflow-x-auto w-full flex-shrink-0" 
          ref={ganttHeaderRef}
          onScroll={(e) => handleGanttScroll(e.currentTarget.scrollLeft, e.currentTarget)}
          style={{ width: '100%' }}
        >
          <div 
            className="flex relative"
            style={{ 
              width: `${Math.max(technicianNameWidth + totalHours * hourWidth, 100)}px`,
              minWidth: '100%'
            }}
          >
            {/* 技術人員名稱區域的佔位 */}
            <div 
              className="flex-shrink-0 sticky left-0 z-10 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
              style={{ width: `${technicianNameWidth}px` }}
            >
            </div>
            {/* 時間軸 */}
            <div className="flex relative">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700"
                  style={{ width: `${hourWidth}px` }}
                >
                  <div className="px-1 text-center">{hour}:00</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 技術人員排程（可垂直和水平滾動） */}
        <div 
          className="overflow-auto border rounded bg-white dark:bg-gray-900" 
          style={{ 
            height: 'calc(100% - 60px)',
            minHeight: '160px',
            maxHeight: 'calc(100% - 60px)',
            overflowX: 'auto',
            overflowY: 'auto',
            width: '100%',
            flexShrink: 0
          }}
          ref={(el) => {
            if (el) ganttRowsRef.current[0] = el;
          }}
          onScroll={(e) => handleGanttScroll(e.currentTarget.scrollLeft, e.currentTarget)}
        >
          <div 
            className="space-y-0.5 pt-1" 
            style={{ 
              minWidth: `${Math.max(technicianNameWidth + totalHours * hourWidth, 100)}px`,
              width: '100%'
            }}
          >
            {technicianSchedules.map((schedule) => (
              <div 
                key={schedule.technician.id} 
                className="flex items-center flex-shrink-0"
                style={{ minHeight: '24px' }}
              >
              <div 
                className="flex relative"
                style={{ 
                  width: `${Math.max(technicianNameWidth + totalHours * hourWidth, 100)}px`,
                  minWidth: '100%'
                }}
              >
                {/* 技術人員名稱區域 */}
                <div 
                  className="flex-shrink-0 flex items-center gap-2 px-2 sticky left-0 z-10 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
                  style={{ width: `${technicianNameWidth}px` }}
                >
                  {/* 狀態指示器（綠點） */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    schedule.technician.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <span 
                    className="text-sm font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFocusTechnicianId(schedule.technician.id);
                      // 只有在非分割視圖模式下，才自動切換到地圖視圖
                      if (viewMode !== 'map' && viewMode !== 'split') {
                        setViewMode('map');
                      }
                    }}
                    title="點擊查看地圖位置"
                  >
                    {schedule.technician.name}
                  </span>
                </div>
                {/* 工單時間軸區域 */}
                <div 
                  className="relative h-5 bg-gray-100 dark:bg-gray-800 rounded"
                  style={{ width: `${totalHours * hourWidth}px` }}
                >
                  {schedule.workOrders.map((wo) => {
                    if (!wo.scheduledStartTime || !wo.scheduledEndTime) return null;
                    const startDate = new Date(wo.scheduledStartTime);
                    const endDate = new Date(wo.scheduledEndTime);
                    const startHourDecimal = startDate.getHours() + startDate.getMinutes() / 60;
                    const endHourDecimal = endDate.getHours() + endDate.getMinutes() / 60;
                    const left = ((startHourDecimal - startHour) / totalHours) * (totalHours * hourWidth);
                    const width = ((endHourDecimal - startHourDecimal) / totalHours) * (totalHours * hourWidth);
                    const bgColor = 
                      wo.status === 'in_progress' ? 'bg-orange-500' :
                      wo.status === 'dispatched' ? 'bg-yellow-500' :
                      wo.status === 'completed' ? 'bg-green-500' :
                      'bg-blue-500';
                    
                    return (
                      <div
                        key={wo.id}
                        className={`absolute ${bgColor} text-white text-xs px-1 rounded h-full flex items-center cursor-pointer hover:opacity-80 transition-opacity`}
                        style={{ left: `${left}px`, width: `${width}px`, minWidth: '60px' }}
                        title={`${wo.id}: ${wo.case?.title || 'N/A'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWorkOrder(wo);
                          setIsWorkOrderDetailOpen(true);
                        }}
                      >
                        <span className="truncate text-center w-full">{wo.customer?.name || wo.id}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            ))}
          </div>
        </div>

        {/* 圖例 */}
        <div className="flex items-center justify-center gap-4 pt-4 pb-2 border-t text-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">已排程</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span className="text-gray-600 dark:text-gray-400">已派送</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span className="text-gray-600 dark:text-gray-400">進行中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-gray-600 dark:text-gray-400">已完成</span>
          </div>
        </div>
      </div>
    );
  };

  // 渲染地圖視圖（使用 Leaflet + OpenStreetMap）
  const renderMapView = () => {
    // 台北市中心座標作為地圖中心
    const centerLat = 25.0330;
    const centerLng = 121.5654;

    // 將待排程工單轉換為地圖位置
    const mockCoordinates = [
      { lat: 25.0400, lng: 121.5700 }, // 信義區附近
      { lat: 25.0260, lng: 121.5500 }, // 大安區附近
      { lat: 25.0200, lng: 121.5400 }, // 中正區附近
    ];

    const workOrderLocations = pendingWorkOrders.slice(0, 3).map((wo, index) => ({
      workOrderId: wo.id,
      latitude: mockCoordinates[index]?.lat || centerLat,
      longitude: mockCoordinates[index]?.lng || centerLng,
      customerName: wo.customer?.name,
    }));

    return (
      <div className="relative w-full h-full" style={{ height: '100%' }}>
        <MapView
          center={[centerLat, centerLng]}
          zoom={12}
          technicianLocations={technicianLocations}
          workOrderLocations={workOrderLocations}
          height="100%"
          focusTechnicianId={focusTechnicianId}
        />
      </div>
    );
  };

  const pendingWorkOrders = workOrders.filter(wo => wo.status === 'pending');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            排程與調度
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            管理工單排程、技術人員分配與即時追蹤
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'gantt' ? 'default' : 'outline'}
            onClick={() => setViewMode('gantt')}
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            甘特圖
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => setViewMode('map')}
            size="sm"
          >
            <MapPin className="h-4 w-4 mr-2" />
            地圖
          </Button>
          <Button
            variant={viewMode === 'split' ? 'default' : 'outline'}
            onClick={() => setViewMode('split')}
            size="sm"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            分割視圖
          </Button>
        </div>
      </div>

      {/* 分割視圖：甘特圖 + 地圖 */}
      {viewMode === 'split' && (
        <div className="grid grid-cols-2 gap-4">
          {/* 左側：甘特圖區域 */}
          <Card className="flex flex-col" style={{ height: 'calc(40vh + 110px)' }}>
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  技術人員排程 (甘特圖)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={ganttZoom <= 0.5}
                    className="h-7 px-2"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[60px] text-center">
                    {Math.round(ganttZoom * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={ganttZoom >= 3}
                    className="h-7 px-2"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0" style={{ display: 'flex', flexDirection: 'column' }}>
              {technicianSchedules.length > 0 ? (
                <div className="flex-1 overflow-hidden px-6 pb-1 pt-1" style={{ display: 'flex', flexDirection: 'column' }}>
                  {renderGanttChart()}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>載入中...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 右側：地圖區域 */}
          <Card className="flex flex-col" style={{ height: 'calc(40vh + 110px)' }}>
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                即時位置追蹤
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0" style={{ display: 'flex', flexDirection: 'column' }}>
              {technicianLocations.length > 0 ? (
                <>
                  <div 
                    className="w-full flex-1 relative" 
                    style={{ 
                      height: '100%',
                      minHeight: '300px'
                    }}
                  >
                    {renderMapView()}
                  </div>
                  {/* 圖例 - 放在地圖下方，橫向排列 */}
                  <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-lg text-xs mt-1 mx-4 mb-1 flex-shrink-0">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                        <span>技術人員（在線）</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-white" />
                        <span>技術人員（離線）</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white" />
                        <span>待排程工單</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>載入中...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 甘特圖視圖 */}
      {viewMode === 'gantt' && (
        <Card className="flex flex-col" style={{ height: 'calc(40vh + 120px)' }}>
          <CardHeader className="flex-shrink-0 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                技術人員排程 (甘特圖)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={ganttZoom <= 0.5}
                  className="h-7 px-2"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[60px] text-center">
                  {Math.round(ganttZoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={ganttZoom >= 3}
                  className="h-7 px-2"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden px-6 pb-6 pt-1">
            {technicianSchedules.length > 0 ? (
              renderGanttChart()
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>載入中...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 地圖視圖 */}
      {viewMode === 'map' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              即時位置追蹤
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {technicianLocations.length > 0 ? (
              <>
                <div className="w-full" style={{ height: '45vw', maxHeight: '500px', minHeight: '300px' }}>
                  {renderMapView()}
                </div>
                {/* 圖例 - 放在地圖下方，橫向排列 */}
                <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-lg text-xs mt-1 mx-4 mb-1 flex-shrink-0">
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                      <span>技術人員（在線）</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-white" />
                      <span>技術人員（離線）</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white" />
                      <span>待排程工單</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>載入中...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 工單池 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            待排程工單池
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingWorkOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>目前沒有待排程的工單</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-muted text-center">工單 ID</TableHead>
                  <TableHead className="bg-muted text-center">客戶</TableHead>
                  <TableHead className="bg-muted text-center">概要</TableHead>
                  <TableHead className="bg-muted text-center">優先級</TableHead>
                  <TableHead className="bg-muted text-center">SLA 到期時間</TableHead>
                  <TableHead className="bg-muted text-center">狀態</TableHead>
                  <TableHead className="bg-muted text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingWorkOrders.map((workOrder) => (
                  <TableRow key={workOrder.id}>
                    <TableCell className="font-medium text-center">{workOrder.id}</TableCell>
                    <TableCell className="text-center">{workOrder.customer?.name || 'N/A'}</TableCell>
                    <TableCell className="text-center">{workOrder.case?.title || 'N/A'}</TableCell>
                    <TableCell className="text-center">{getPriorityBadge(workOrder.priority)}</TableCell>
                    <TableCell className="text-center">
                      {workOrder.slaDeadline ? (
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(workOrder.slaDeadline).toLocaleString('zh-TW')}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div 
                        onClick={() => {
                          setEditingWorkOrder(workOrder);
                          setIsWorkOrderDetailOpen(true);
                        }}
                        className="cursor-pointer inline-block"
                      >
                        {getStatusBadge(workOrder.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        onClick={() => handleGetSuggestions(workOrder)}
                      >
                        建議
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 智慧排程建議 Modal */}
      <Dialog open={isSuggestionModalOpen} onOpenChange={setIsSuggestionModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>智慧排程建議</DialogTitle>
            <DialogDescription>
              系統建議以下技術人員適合處理此工單
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {suggestions.map((suggestion, index) => (
              <Card key={suggestion.technicianId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4" />
                        <span className="font-semibold">{suggestion.technicianName}</span>
                        <Badge>適合度: {suggestion.score}%</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {suggestion.reasons.map((reason, idx) => (
                          <Badge key={idx} variant="outline">{reason}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => selectedWorkOrder && handleAssignWorkOrder(selectedWorkOrder.id, suggestion.technicianId)}
                      className="ml-4"
                    >
                      指派
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 工單詳情/編輯 Modal */}
      <Dialog open={isWorkOrderDetailOpen} onOpenChange={setIsWorkOrderDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>工單詳情</DialogTitle>
            <DialogDescription>
              工單編號: {editingWorkOrder?.id}
            </DialogDescription>
          </DialogHeader>
          {editingWorkOrder && (
            <WorkOrderDetailForm
              workOrder={editingWorkOrder}
              onSave={handleSaveWorkOrder}
              onCancel={() => {
                setIsWorkOrderDetailOpen(false);
                setEditingWorkOrder(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 工單詳情表單組件
function WorkOrderDetailForm({ 
  workOrder, 
  onSave, 
  onCancel 
}: { 
  workOrder: WorkOrder; 
  onSave: (workOrder: WorkOrder) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<WorkOrder>(workOrder);

  useEffect(() => {
    setFormData(workOrder);
  }, [workOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleFieldChange = (field: keyof WorkOrder, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCaseFieldChange = (field: keyof Case, value: any) => {
    if (!formData.case) return;
    setFormData(prev => ({
      ...prev,
      case: {
        ...prev.case!,
        [field]: value,
      },
    }));
  };

  const handleCustomerFieldChange = (field: keyof Customer, value: any) => {
    if (!formData.customer) return;
    setFormData(prev => ({
      ...prev,
      customer: {
        ...prev.customer!,
        [field]: value,
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">狀態</Label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => handleFieldChange('status', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="pending">待排程</option>
            <option value="scheduled">已排程</option>
            <option value="dispatched">已派送</option>
            <option value="in_progress">進行中</option>
            <option value="completed">已完成</option>
            <option value="billed">已結帳</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">優先級</Label>
          <select
            id="priority"
            value={formData.priority || 'medium'}
            onChange={(e) => handleFieldChange('priority', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="urgent">緊急</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduledStartTime">排程開始時間</Label>
          <Input
            id="scheduledStartTime"
            type="datetime-local"
            value={formData.scheduledStartTime ? new Date(formData.scheduledStartTime).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleFieldChange('scheduledStartTime', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduledEndTime">排程結束時間</Label>
          <Input
            id="scheduledEndTime"
            type="datetime-local"
            value={formData.scheduledEndTime ? new Date(formData.scheduledEndTime).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleFieldChange('scheduledEndTime', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerName">客戶名稱</Label>
        <Input
          id="customerName"
          value={formData.customer?.name || ''}
          onChange={(e) => handleCustomerFieldChange('name', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerAddress">客戶地址</Label>
        <Input
          id="customerAddress"
          value={formData.customer?.address || ''}
          onChange={(e) => handleCustomerFieldChange('address', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerPhone">客戶電話</Label>
          <Input
            id="customerPhone"
            value={formData.customer?.contactInfo?.phone || ''}
            onChange={(e) => {
              if (!formData.customer) return;
              setFormData(prev => ({
                ...prev,
                customer: {
                  ...prev.customer!,
                  contactInfo: {
                    ...prev.customer!.contactInfo,
                    phone: e.target.value,
                  },
                },
              }));
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerEmail">客戶 Email</Label>
          <Input
            id="customerEmail"
            type="email"
            value={formData.customer?.contactInfo?.email || ''}
            onChange={(e) => {
              if (!formData.customer) return;
              setFormData(prev => ({
                ...prev,
                customer: {
                  ...prev.customer!,
                  contactInfo: {
                    ...prev.customer!.contactInfo,
                    email: e.target.value,
                  },
                },
              }));
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="caseTitle">案件標題</Label>
        <Input
          id="caseTitle"
          value={formData.case?.title || ''}
          onChange={(e) => handleCaseFieldChange('title', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="caseDescription">案件描述</Label>
        <Textarea
          id="caseDescription"
          value={formData.case?.description || ''}
          onChange={(e) => handleCaseFieldChange('description', e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slaDeadline">SLA 到期時間</Label>
        <Input
          id="slaDeadline"
          type="datetime-local"
          value={formData.slaDeadline ? new Date(formData.slaDeadline).toISOString().slice(0, 16) : ''}
          onChange={(e) => handleFieldChange('slaDeadline', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          保存
        </Button>
      </div>
    </form>
  );
}

