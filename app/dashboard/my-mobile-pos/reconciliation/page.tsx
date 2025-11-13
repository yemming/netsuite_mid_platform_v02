'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { FileCheck, Calendar, Eye, CheckCircle2, XCircle, AlertCircle, Search, Database } from 'lucide-react';
import { posDB, OrderingRecord, ReceivingRecord, POSItem, OrderingItem, ReceivingItem } from '@/lib/indexeddb-pos';

// 簡單的 toast 通知系統
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
};

interface ReconciliationItem {
  barcode: string;
  name: string;
  unit: string;
  orderingQuantity: number;
  receivingQuantity: number;
  difference: number;
  status: 'matched' | 'short' | 'over' | 'missing';
}

interface ReconciliationRecord {
  id?: string;
  orderingNumber: string;
  receivingNumber?: string;
  items: ReconciliationItem[];
  status: 'pending' | 'completed' | 'discrepancy';
  memo?: string;
  createdAt: Date;
}

export default function POSReconciliationPage() {
  const [orderingRecords, setOrderingRecords] = useState<OrderingRecord[]>([]);
  const [receivingRecords, setReceivingRecords] = useState<ReceivingRecord[]>([]);
  const [reconciliationRecords, setReconciliationRecords] = useState<ReconciliationRecord[]>([]);
  const [selectedOrdering, setSelectedOrdering] = useState<OrderingRecord | null>(null);
  const [selectedReceiving, setSelectedReceiving] = useState<ReceivingRecord | null>(null);
  const [reconciliationItems, setReconciliationItems] = useState<ReconciliationItem[]>([]);
  const [memo, setMemo] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState<ReconciliationRecord | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchOrdering, setSearchOrdering] = useState('');
  const [searchReceiving, setSearchReceiving] = useState('');

  // 初始化並載入資料
  useEffect(() => {
    const init = async () => {
      try {
        await posDB.init();
        setIsInitialized(true);
        
        // 先載入資料
        await loadOrderingRecords();
        await loadReceivingRecords();
        await loadReconciliationRecords();

        // 檢查是否需要自動建立測試資料
        // 檢查 localStorage 中是否已有資料（避免重複建立）
        const hasExistingData = localStorage.getItem('pos_test_data_created') === 'true';

        if (!hasExistingData) {
          // 重新載入一次以獲取最新狀態
          const currentOrderings = await posDB.getAllOrderings();
          const currentReceivings = await posDB.getAllReceivings();
          const storedReconciliations = localStorage.getItem('pos_reconciliations');
          const currentReconciliations = storedReconciliations ? JSON.parse(storedReconciliations) : [];

          // 如果沒有任何資料，自動建立測試資料
          if (
            currentOrderings.length === 0 &&
            currentReceivings.length === 0 &&
            currentReconciliations.length === 0
          ) {
            // 延遲一下再建立，讓使用者看到載入完成
            setTimeout(async () => {
              await handleCreateTestDataSilently();
            }, 500);
          }
        }
      } catch (error) {
        console.error('初始化失敗:', error);
        showToast('系統初始化失敗', 'error');
      }
    };

    init();
  }, []);

  // 載入訂貨記錄
  const loadOrderingRecords = async () => {
    try {
      const records = await posDB.getAllOrderings();
      setOrderingRecords(records);
    } catch (error) {
      console.error('載入訂貨記錄失敗:', error);
      showToast('載入訂貨記錄失敗', 'error');
    }
  };

  // 載入收貨記錄
  const loadReceivingRecords = async () => {
    try {
      const records = await posDB.getAllReceivings();
      setReceivingRecords(records);
    } catch (error) {
      console.error('載入收貨記錄失敗:', error);
      showToast('載入收貨記錄失敗', 'error');
    }
  };

  // 載入對賬記錄（從 localStorage）
  const loadReconciliationRecords = () => {
    try {
      const stored = localStorage.getItem('pos_reconciliations');
      if (stored) {
        const records = JSON.parse(stored);
        // 轉換日期字串為 Date 物件
        const parsed = records.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
        }));
        setReconciliationRecords(parsed);
      }
    } catch (error) {
      console.error('載入對賬記錄失敗:', error);
    }
  };

  // 儲存對賬記錄（到 localStorage）
  const saveReconciliationRecord = (record: ReconciliationRecord) => {
    try {
      const stored = localStorage.getItem('pos_reconciliations');
      const records = stored ? JSON.parse(stored) : [];
      records.push(record);
      localStorage.setItem('pos_reconciliations', JSON.stringify(records));
      loadReconciliationRecords();
    } catch (error) {
      console.error('儲存對賬記錄失敗:', error);
      throw error;
    }
  };

  // 選擇訂貨記錄
  const handleSelectOrdering = (ordering: OrderingRecord) => {
    setSelectedOrdering(ordering);
    setSelectedReceiving(null);
    setReconciliationItems([]);
    setMemo('');
  };

  // 選擇收貨記錄
  const handleSelectReceiving = (receiving: ReceivingRecord) => {
    setSelectedReceiving(receiving);
    performReconciliation();
  };

  // 執行對賬
  const performReconciliation = () => {
    if (!selectedOrdering) {
      showToast('請先選擇訂貨記錄', 'error');
      return;
    }

    const items: ReconciliationItem[] = selectedOrdering.items.map((orderingItem) => {
      // 尋找對應的收貨項目
      const receivingItem = selectedReceiving
        ? selectedReceiving.items.find((ri) => ri.barcode === orderingItem.barcode)
        : null;

      const receivingQty = receivingItem ? receivingItem.quantity : 0;
      const difference = receivingQty - orderingItem.quantity;

      let status: 'matched' | 'short' | 'over' | 'missing' = 'matched';
      if (!selectedReceiving || !receivingItem) {
        status = 'missing';
      } else if (difference < 0) {
        status = 'short';
      } else if (difference > 0) {
        status = 'over';
      }

      return {
        barcode: orderingItem.barcode,
        name: orderingItem.name,
        unit: orderingItem.unit,
        orderingQuantity: orderingItem.quantity,
        receivingQuantity: receivingQty,
        difference,
        status,
      };
    });

    // 如果有收貨記錄，也要檢查收貨記錄中有但訂貨記錄中沒有的項目
    if (selectedReceiving) {
      selectedReceiving.items.forEach((receivingItem) => {
        const exists = items.find((item) => item.barcode === receivingItem.barcode);
        if (!exists) {
          items.push({
            barcode: receivingItem.barcode,
            name: receivingItem.name,
            unit: receivingItem.unit,
            orderingQuantity: 0,
            receivingQuantity: receivingItem.quantity,
            difference: receivingItem.quantity,
            status: 'over',
          });
        }
      });
    }

    setReconciliationItems(items);
  };

  // 儲存對賬記錄
  const handleSave = () => {
    if (!selectedOrdering) {
      showToast('請先選擇訂貨記錄', 'error');
      return;
    }

    if (reconciliationItems.length === 0) {
      showToast('請先執行對賬', 'error');
      return;
    }

    try {
      const hasDiscrepancy = reconciliationItems.some((item) => item.status !== 'matched');
      const status: 'pending' | 'completed' | 'discrepancy' = hasDiscrepancy
        ? 'discrepancy'
        : 'completed';

      const reconciliationRecord: ReconciliationRecord = {
        id: `REC${Date.now()}`,
        orderingNumber: selectedOrdering.orderingNumber,
        receivingNumber: selectedReceiving?.receivingNumber,
        items: reconciliationItems,
        status,
        memo: memo.trim() || undefined,
        createdAt: new Date(),
      };

      saveReconciliationRecord(reconciliationRecord);

      // 清空表單
      setSelectedOrdering(null);
      setSelectedReceiving(null);
      setReconciliationItems([]);
      setMemo('');

      showToast(`對賬記錄已儲存！對賬單號：${reconciliationRecord.id}`, 'success');
    } catch (error) {
      console.error('儲存失敗:', error);
      showToast('儲存失敗', 'error');
    }
  };

  // 查看對賬記錄詳情
  const handleViewDetail = (record: ReconciliationRecord) => {
    setSelectedReconciliation(record);
    setIsDetailOpen(true);
  };

  // 格式化日期時間
  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 取得狀態標籤
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">已完成</Badge>;
      case 'discrepancy':
        return <Badge className="bg-yellow-500">有差異</Badge>;
      case 'pending':
        return <Badge className="bg-gray-500">待處理</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // 取得項目狀態圖示
  const getItemStatusIcon = (status: string) => {
    switch (status) {
      case 'matched':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'short':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'over':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // 過濾訂貨記錄
  const filteredOrderingRecords = orderingRecords.filter((record) =>
    record.orderingNumber.toLowerCase().includes(searchOrdering.toLowerCase()) ||
    record.supplier?.toLowerCase().includes(searchOrdering.toLowerCase())
  );

  // 過濾收貨記錄
  const filteredReceivingRecords = receivingRecords.filter((record) =>
    record.receivingNumber.toLowerCase().includes(searchReceiving.toLowerCase()) ||
    record.supplier?.toLowerCase().includes(searchReceiving.toLowerCase())
  );

  // 靜默建立測試資料（用於自動初始化）
  const handleCreateTestDataSilently = async () => {
    try {
      // 1. 創建測試產品並獲取 ID
      const testProducts: POSItem[] = [
        { barcode: 'P001', name: '可口可樂 330ml', price: 25, unit: '瓶' },
        { barcode: 'P002', name: '統一泡麵 袋裝', price: 35, unit: '包' },
        { barcode: 'P003', name: '衛生紙 3層', price: 120, unit: '包' },
        { barcode: 'P004', name: '礦泉水 600ml', price: 20, unit: '瓶' },
        { barcode: 'P005', name: '餅乾 綜合包', price: 45, unit: '包' },
        { barcode: 'P006', name: '牛奶 1L', price: 85, unit: '瓶' },
        { barcode: 'P007', name: '麵包 吐司', price: 55, unit: '條' },
        { barcode: 'P008', name: '雞蛋 一盒', price: 80, unit: '盒' },
      ];

      const productIdMap: { [barcode: string]: number } = {};
      for (const product of testProducts) {
        const id = await posDB.upsertItem(product);
        productIdMap[product.barcode] = id;
      }

      // 2. 創建測試訂貨記錄
      const now = new Date();
      const testOrderings: OrderingRecord[] = [
        {
          orderingNumber: 'ORD20250101001',
          items: [
            { itemId: productIdMap['P001'], barcode: 'P001', name: '可口可樂 330ml', unit: '瓶', quantity: 20 },
            { itemId: productIdMap['P002'], barcode: 'P002', name: '統一泡麵 袋裝', unit: '包', quantity: 30 },
            { itemId: productIdMap['P003'], barcode: 'P003', name: '衛生紙 3層', unit: '包', quantity: 10 },
            { itemId: productIdMap['P004'], barcode: 'P004', name: '礦泉水 600ml', unit: '瓶', quantity: 24 },
          ],
          supplier: '統一超商供應商',
          memo: '急需補貨，請盡快送達',
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5天前
        },
        {
          orderingNumber: 'ORD20250102001',
          items: [
            { itemId: productIdMap['P005'], barcode: 'P005', name: '餅乾 綜合包', unit: '包', quantity: 15 },
            { itemId: productIdMap['P006'], barcode: 'P006', name: '牛奶 1L', unit: '瓶', quantity: 12 },
            { itemId: productIdMap['P007'], barcode: 'P007', name: '麵包 吐司', unit: '條', quantity: 8 },
          ],
          supplier: '全聯供應商',
          memo: '定期補貨',
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3天前
        },
        {
          orderingNumber: 'ORD20250103001',
          items: [
            { itemId: productIdMap['P008'], barcode: 'P008', name: '雞蛋 一盒', unit: '盒', quantity: 20 },
            { itemId: productIdMap['P001'], barcode: 'P001', name: '可口可樂 330ml', unit: '瓶', quantity: 15 },
          ],
          supplier: '家樂福供應商',
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1天前
        },
      ];

      for (const ordering of testOrderings) {
        await posDB.createOrdering(ordering);
      }

      // 3. 創建測試收貨記錄（有些對應訂貨，有些不對應）
      const testReceivings: ReceivingRecord[] = [
        {
          receivingNumber: 'RCV20250101001',
          items: [
            { itemId: productIdMap['P001'], barcode: 'P001', name: '可口可樂 330ml', unit: '瓶', quantity: 18 }, // 短缺 2
            { itemId: productIdMap['P002'], barcode: 'P002', name: '統一泡麵 袋裝', unit: '包', quantity: 30 }, // 相符
            { itemId: productIdMap['P003'], barcode: 'P003', name: '衛生紙 3層', unit: '包', quantity: 10 }, // 相符
            { itemId: productIdMap['P004'], barcode: 'P004', name: '礦泉水 600ml', unit: '瓶', quantity: 26 }, // 超收 2
            { itemId: productIdMap['P005'], barcode: 'P005', name: '餅乾 綜合包', unit: '包', quantity: 5 }, // 額外收貨
          ],
          supplier: '統一超商供應商',
          memo: '部分商品短缺，已通知補貨',
          createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4天前
        },
        {
          receivingNumber: 'RCV20250102001',
          items: [
            { itemId: productIdMap['P005'], barcode: 'P005', name: '餅乾 綜合包', unit: '包', quantity: 15 }, // 相符
            { itemId: productIdMap['P006'], barcode: 'P006', name: '牛奶 1L', unit: '瓶', quantity: 10 }, // 短缺 2
            { itemId: productIdMap['P007'], barcode: 'P007', name: '麵包 吐司', unit: '條', quantity: 8 }, // 相符
          ],
          supplier: '全聯供應商',
          memo: '牛奶短缺，已補訂',
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2天前
        },
        {
          receivingNumber: 'RCV20250103001',
          items: [
            { itemId: productIdMap['P001'], barcode: 'P001', name: '可口可樂 330ml', unit: '瓶', quantity: 50 }, // 額外收貨
            { itemId: productIdMap['P004'], barcode: 'P004', name: '礦泉水 600ml', unit: '瓶', quantity: 30 }, // 額外收貨
          ],
          supplier: '家樂福供應商',
          memo: '緊急補貨',
          createdAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000), // 12小時前
        },
      ];

      for (const receiving of testReceivings) {
        await posDB.createReceiving(receiving);
      }

      // 4. 創建測試對賬記錄
      const testReconciliations: ReconciliationRecord[] = [
        {
          id: 'REC20250101001',
          orderingNumber: 'ORD20250101001',
          receivingNumber: 'RCV20250101001',
          items: [
            {
              barcode: 'P001',
              name: '可口可樂 330ml',
              unit: '瓶',
              orderingQuantity: 20,
              receivingQuantity: 18,
              difference: -2,
              status: 'short',
            },
            {
              barcode: 'P002',
              name: '統一泡麵 袋裝',
              unit: '包',
              orderingQuantity: 30,
              receivingQuantity: 30,
              difference: 0,
              status: 'matched',
            },
            {
              barcode: 'P003',
              name: '衛生紙 3層',
              unit: '包',
              orderingQuantity: 10,
              receivingQuantity: 10,
              difference: 0,
              status: 'matched',
            },
            {
              barcode: 'P004',
              name: '礦泉水 600ml',
              unit: '瓶',
              orderingQuantity: 24,
              receivingQuantity: 26,
              difference: 2,
              status: 'over',
            },
            {
              barcode: 'P005',
              name: '餅乾 綜合包',
              unit: '包',
              orderingQuantity: 0,
              receivingQuantity: 5,
              difference: 5,
              status: 'over',
            },
          ],
          status: 'discrepancy',
          memo: '有部分商品短缺和超收，需處理',
          createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'REC20250102001',
          orderingNumber: 'ORD20250102001',
          receivingNumber: 'RCV20250102001',
          items: [
            {
              barcode: 'P005',
              name: '餅乾 綜合包',
              unit: '包',
              orderingQuantity: 15,
              receivingQuantity: 15,
              difference: 0,
              status: 'matched',
            },
            {
              barcode: 'P006',
              name: '牛奶 1L',
              unit: '瓶',
              orderingQuantity: 12,
              receivingQuantity: 10,
              difference: -2,
              status: 'short',
            },
            {
              barcode: 'P007',
              name: '麵包 吐司',
              unit: '條',
              orderingQuantity: 8,
              receivingQuantity: 8,
              difference: 0,
              status: 'matched',
            },
          ],
          status: 'discrepancy',
          memo: '牛奶短缺 2 瓶',
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
      ];

      // 儲存對賬記錄到 localStorage
      const existing = localStorage.getItem('pos_reconciliations');
      const allRecords = existing ? JSON.parse(existing) : [];
      allRecords.push(...testReconciliations);
      localStorage.setItem('pos_reconciliations', JSON.stringify(allRecords));

      // 標記已建立測試資料
      localStorage.setItem('pos_test_data_created', 'true');

      // 重新載入資料
      await loadOrderingRecords();
      await loadReceivingRecords();
      loadReconciliationRecords();
    } catch (error) {
      console.error('建立測試資料失敗:', error);
    }
  };

  // 建立測試資料
  const handleCreateTestData = async () => {
    try {
      // 1. 創建測試產品並獲取 ID
      const testProducts: POSItem[] = [
        { barcode: 'P001', name: '可口可樂 330ml', price: 25, unit: '瓶' },
        { barcode: 'P002', name: '統一泡麵 袋裝', price: 35, unit: '包' },
        { barcode: 'P003', name: '衛生紙 3層', price: 120, unit: '包' },
        { barcode: 'P004', name: '礦泉水 600ml', price: 20, unit: '瓶' },
        { barcode: 'P005', name: '餅乾 綜合包', price: 45, unit: '包' },
        { barcode: 'P006', name: '牛奶 1L', price: 85, unit: '瓶' },
        { barcode: 'P007', name: '麵包 吐司', price: 55, unit: '條' },
        { barcode: 'P008', name: '雞蛋 一盒', price: 80, unit: '盒' },
      ];

      const productIdMap: { [barcode: string]: number } = {};
      for (const product of testProducts) {
        const id = await posDB.upsertItem(product);
        productIdMap[product.barcode] = id;
      }

      // 2. 創建測試訂貨記錄
      const now = new Date();
      const testOrderings: OrderingRecord[] = [
        {
          orderingNumber: 'ORD20250101001',
          items: [
            { itemId: productIdMap['P001'], barcode: 'P001', name: '可口可樂 330ml', unit: '瓶', quantity: 20 },
            { itemId: productIdMap['P002'], barcode: 'P002', name: '統一泡麵 袋裝', unit: '包', quantity: 30 },
            { itemId: productIdMap['P003'], barcode: 'P003', name: '衛生紙 3層', unit: '包', quantity: 10 },
            { itemId: productIdMap['P004'], barcode: 'P004', name: '礦泉水 600ml', unit: '瓶', quantity: 24 },
          ],
          supplier: '統一超商供應商',
          memo: '急需補貨，請盡快送達',
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5天前
        },
        {
          orderingNumber: 'ORD20250102001',
          items: [
            { itemId: productIdMap['P005'], barcode: 'P005', name: '餅乾 綜合包', unit: '包', quantity: 15 },
            { itemId: productIdMap['P006'], barcode: 'P006', name: '牛奶 1L', unit: '瓶', quantity: 12 },
            { itemId: productIdMap['P007'], barcode: 'P007', name: '麵包 吐司', unit: '條', quantity: 8 },
          ],
          supplier: '全聯供應商',
          memo: '定期補貨',
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3天前
        },
        {
          orderingNumber: 'ORD20250103001',
          items: [
            { itemId: productIdMap['P008'], barcode: 'P008', name: '雞蛋 一盒', unit: '盒', quantity: 20 },
            { itemId: productIdMap['P001'], barcode: 'P001', name: '可口可樂 330ml', unit: '瓶', quantity: 15 },
          ],
          supplier: '家樂福供應商',
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1天前
        },
      ];

      for (const ordering of testOrderings) {
        await posDB.createOrdering(ordering);
      }

      // 3. 創建測試收貨記錄（有些對應訂貨，有些不對應）
      const testReceivings: ReceivingRecord[] = [
        {
          receivingNumber: 'RCV20250101001',
          items: [
            { itemId: productIdMap['P001'], barcode: 'P001', name: '可口可樂 330ml', unit: '瓶', quantity: 18 }, // 短缺 2
            { itemId: productIdMap['P002'], barcode: 'P002', name: '統一泡麵 袋裝', unit: '包', quantity: 30 }, // 相符
            { itemId: productIdMap['P003'], barcode: 'P003', name: '衛生紙 3層', unit: '包', quantity: 10 }, // 相符
            { itemId: productIdMap['P004'], barcode: 'P004', name: '礦泉水 600ml', unit: '瓶', quantity: 26 }, // 超收 2
            { itemId: productIdMap['P005'], barcode: 'P005', name: '餅乾 綜合包', unit: '包', quantity: 5 }, // 額外收貨
          ],
          supplier: '統一超商供應商',
          memo: '部分商品短缺，已通知補貨',
          createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4天前
        },
        {
          receivingNumber: 'RCV20250102001',
          items: [
            { itemId: productIdMap['P005'], barcode: 'P005', name: '餅乾 綜合包', unit: '包', quantity: 15 }, // 相符
            { itemId: productIdMap['P006'], barcode: 'P006', name: '牛奶 1L', unit: '瓶', quantity: 10 }, // 短缺 2
            { itemId: productIdMap['P007'], barcode: 'P007', name: '麵包 吐司', unit: '條', quantity: 8 }, // 相符
          ],
          supplier: '全聯供應商',
          memo: '牛奶短缺，已補訂',
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2天前
        },
        {
          receivingNumber: 'RCV20250103001',
          items: [
            { itemId: productIdMap['P001'], barcode: 'P001', name: '可口可樂 330ml', unit: '瓶', quantity: 50 }, // 額外收貨
            { itemId: productIdMap['P004'], barcode: 'P004', name: '礦泉水 600ml', unit: '瓶', quantity: 30 }, // 額外收貨
          ],
          supplier: '家樂福供應商',
          memo: '緊急補貨',
          createdAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000), // 12小時前
        },
      ];

      for (const receiving of testReceivings) {
        await posDB.createReceiving(receiving);
      }

      // 4. 創建測試對賬記錄
      const testReconciliations: ReconciliationRecord[] = [
        {
          id: 'REC20250101001',
          orderingNumber: 'ORD20250101001',
          receivingNumber: 'RCV20250101001',
          items: [
            {
              barcode: 'P001',
              name: '可口可樂 330ml',
              unit: '瓶',
              orderingQuantity: 20,
              receivingQuantity: 18,
              difference: -2,
              status: 'short',
            },
            {
              barcode: 'P002',
              name: '統一泡麵 袋裝',
              unit: '包',
              orderingQuantity: 30,
              receivingQuantity: 30,
              difference: 0,
              status: 'matched',
            },
            {
              barcode: 'P003',
              name: '衛生紙 3層',
              unit: '包',
              orderingQuantity: 10,
              receivingQuantity: 10,
              difference: 0,
              status: 'matched',
            },
            {
              barcode: 'P004',
              name: '礦泉水 600ml',
              unit: '瓶',
              orderingQuantity: 24,
              receivingQuantity: 26,
              difference: 2,
              status: 'over',
            },
            {
              barcode: 'P005',
              name: '餅乾 綜合包',
              unit: '包',
              orderingQuantity: 0,
              receivingQuantity: 5,
              difference: 5,
              status: 'over',
            },
          ],
          status: 'discrepancy',
          memo: '有部分商品短缺和超收，需處理',
          createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'REC20250102001',
          orderingNumber: 'ORD20250102001',
          receivingNumber: 'RCV20250102001',
          items: [
            {
              barcode: 'P005',
              name: '餅乾 綜合包',
              unit: '包',
              orderingQuantity: 15,
              receivingQuantity: 15,
              difference: 0,
              status: 'matched',
            },
            {
              barcode: 'P006',
              name: '牛奶 1L',
              unit: '瓶',
              orderingQuantity: 12,
              receivingQuantity: 10,
              difference: -2,
              status: 'short',
            },
            {
              barcode: 'P007',
              name: '麵包 吐司',
              unit: '條',
              orderingQuantity: 8,
              receivingQuantity: 8,
              difference: 0,
              status: 'matched',
            },
          ],
          status: 'discrepancy',
          memo: '牛奶短缺 2 瓶',
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
      ];

      // 儲存對賬記錄到 localStorage
      const existing = localStorage.getItem('pos_reconciliations');
      const allRecords = existing ? JSON.parse(existing) : [];
      allRecords.push(...testReconciliations);
      localStorage.setItem('pos_reconciliations', JSON.stringify(allRecords));

      // 標記已建立測試資料
      localStorage.setItem('pos_test_data_created', 'true');

      // 重新載入資料
      await loadOrderingRecords();
      await loadReceivingRecords();
      loadReconciliationRecords();

      showToast('測試資料建立成功！已建立 8 個產品、3 筆訂貨記錄、3 筆收貨記錄、2 筆對賬記錄', 'success');
    } catch (error) {
      console.error('建立測試資料失敗:', error);
      showToast('建立測試資料失敗', 'error');
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">初始化中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] pb-6">
      <div className="max-w-7xl mx-auto p-4">
        {/* 標題列 */}
        <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">門市對賬</h1>
              {reconciliationItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {reconciliationItems.length} 項
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateTestData}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                <Database className="h-4 w-4 mr-2" />
                建立測試資料
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryOpen(true)}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                <Calendar className="h-4 w-4 mr-2" />
                對賬記錄
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左側：選擇訂貨和收貨記錄 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 選擇訂貨記錄 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base dark:text-white">選擇訂貨記錄</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="搜尋訂貨單號或供應商..."
                      value={searchOrdering}
                      onChange={(e) => setSearchOrdering(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredOrderingRecords.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        尚無訂貨記錄
                      </p>
                    ) : (
                      filteredOrderingRecords.map((record) => (
                        <div
                          key={record.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedOrdering?.id === record.id
                              ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => handleSelectOrdering(record)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                              {record.orderingNumber}
                            </p>
                            <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                              {record.items.length} 項
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(record.createdAt)}
                          </p>
                          {record.supplier && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              供應商：{record.supplier}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 選擇收貨記錄 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base dark:text-white">選擇收貨記錄（選填）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="搜尋收貨單號或供應商..."
                      value={searchReceiving}
                      onChange={(e) => setSearchReceiving(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredReceivingRecords.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        尚無收貨記錄
                      </p>
                    ) : (
                      filteredReceivingRecords.map((record) => (
                        <div
                          key={record.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedReceiving?.id === record.id
                              ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => handleSelectReceiving(record)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                              {record.receivingNumber}
                            </p>
                            <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                              {record.items.length} 項
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(record.createdAt)}
                          </p>
                          {record.supplier && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              供應商：{record.supplier}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側：對賬結果 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 對賬結果 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base dark:text-white">對賬結果</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedOrdering ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>請先選擇訂貨記錄</p>
                  </div>
                ) : reconciliationItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>請選擇收貨記錄進行對賬，或直接儲存訂貨記錄</p>
                    <Button
                      onClick={performReconciliation}
                      className="mt-4"
                      variant="outline"
                    >
                      執行對賬（無收貨記錄）
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reconciliationItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {getItemStatusIcon(item.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            條碼：{item.barcode} | 單位：{item.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <p className="text-gray-500 dark:text-gray-400">訂貨</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {item.orderingQuantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 dark:text-gray-400">收貨</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {item.receivingQuantity}
                            </p>
                          </div>
                          <div className="text-right min-w-[60px]">
                            <p className="text-gray-500 dark:text-gray-400">差異</p>
                            <p
                              className={`font-medium ${
                                item.difference === 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : item.difference < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {item.difference > 0 ? '+' : ''}
                              {item.difference}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 對賬資訊 */}
            {selectedOrdering && (
              <Card className="dark:bg-[#1a2332] dark:border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base dark:text-white">對賬資訊</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>訂貨單號</Label>
                    <Input
                      type="text"
                      value={selectedOrdering.orderingNumber}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  {selectedReceiving && (
                    <div>
                      <Label>收貨單號</Label>
                      <Input
                        type="text"
                        value={selectedReceiving.receivingNumber}
                        disabled
                        className="mt-1"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="memo">備註（選填）</Label>
                    <Textarea
                      id="memo"
                      placeholder="輸入對賬備註資訊"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleSave}
                    className="w-full"
                    disabled={!selectedOrdering || reconciliationItems.length === 0}
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    儲存對賬記錄
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 對賬記錄詳情對話框 */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>對賬記錄詳情</DialogTitle>
              <DialogDescription>
                對賬單號：{selectedReconciliation?.id}
              </DialogDescription>
            </DialogHeader>

            {selectedReconciliation && (
              <div className="space-y-4 py-4">
                {/* 對賬資訊 */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">對賬時間</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatDateTime(selectedReconciliation.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">訂貨單號</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {selectedReconciliation.orderingNumber}
                    </span>
                  </div>
                  {selectedReconciliation.receivingNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">收貨單號</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {selectedReconciliation.receivingNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">狀態</span>
                    {getStatusBadge(selectedReconciliation.status)}
                  </div>
                  {selectedReconciliation.memo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">備註</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {selectedReconciliation.memo}
                      </span>
                    </div>
                  )}
                </div>

                {/* 對賬明細 */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">對賬明細</h3>
                  <div className="space-y-2">
                    {selectedReconciliation.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {getItemStatusIcon(item.status)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            條碼：{item.barcode} | 單位：{item.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <p className="text-gray-500 dark:text-gray-400">訂貨</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {item.orderingQuantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 dark:text-gray-400">收貨</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {item.receivingQuantity}
                            </p>
                          </div>
                          <div className="text-right min-w-[60px]">
                            <p className="text-gray-500 dark:text-gray-400">差異</p>
                            <p
                              className={`font-medium ${
                                item.difference === 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : item.difference < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {item.difference > 0 ? '+' : ''}
                              {item.difference}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                關閉
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 對賬記錄歷史對話框 */}
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>對賬記錄</DialogTitle>
              <DialogDescription>查看所有對賬記錄</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {reconciliationRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>尚無對賬記錄</p>
                </div>
              ) : (
                reconciliationRecords.map((record) => (
                  <Card
                    key={record.id}
                    className="dark:bg-[#1a2332] dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setIsHistoryOpen(false);
                      handleViewDetail(record);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {record.id}
                            </h3>
                            {getStatusBadge(record.status)}
                            <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                              {record.items.length} 項商品
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(record.createdAt)}
                            </div>
                            <span>訂貨單：{record.orderingNumber}</span>
                            {record.receivingNumber && (
                              <span>收貨單：{record.receivingNumber}</span>
                            )}
                            <span>
                              差異項：
                              {record.items.filter((item) => item.status !== 'matched').length}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsHistoryOpen(false);
                            handleViewDetail(record);
                          }}
                          className="dark:text-gray-300"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          查看
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>
                關閉
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

