'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { StatusLight } from '@/components/ui/status-light';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TableSyncStatus {
  tableName: string;
  label: string;
  success: boolean;
  totalRecords: number;
  lastSyncTime: string | null;
  lastUpdateTime: string | null;
  error?: string;
}

interface SyncAction {
  tableName: string;
  syncing: boolean;
  pending: boolean; // 待同步狀態
  status: 'success' | 'error' | null;
  message: string;
  data?: any;
}

interface TableConfig {
  name: string;
  label: string;
  api: string;
  priority: string;
  disabled?: boolean;
  disabledReason?: string;
}

const TABLE_CONFIG: TableConfig[] = [
  { name: 'ns_subsidiaries', label: '公司別', api: '/api/sync-subsidiaries', priority: '最高' },
  { name: 'ns_currencies', label: '幣別', api: '/api/sync-currencies', priority: '最高' },
  { name: 'ns_accounting_periods', label: '會計期間', api: '/api/sync-accounting-periods', priority: '最高' },
  { name: 'ns_departments', label: '部門', api: '/api/sync-departments', priority: '中' },
  { name: 'ns_classes', label: '類別', api: '/api/sync-classes', priority: '中' },
  { name: 'ns_locations', label: '地點', api: '/api/sync-locations', priority: '中' },
  { name: 'ns_accounts', label: '會計科目', api: '/api/sync-accounts', priority: '中' },
  { name: 'ns_terms', label: '付款條件', api: '/api/sync-terms', priority: '低' },
  { name: 'ns_tax_codes', label: '稅碼', api: '/api/sync-tax-codes', priority: '高' },
  { name: 'ns_expense_categories', label: '費用類別', api: '/api/sync-expense-categories', priority: '中' },
  { name: 'ns_items', label: '產品主檔', api: '/api/sync-items', priority: '最高' },
  { name: 'ns_entities_customers', label: '客戶', api: '/api/sync-customers', priority: '高' },
  { name: 'ns_entities_vendors', label: '供應商', api: '/api/sync-vendors', priority: '中' },
  { name: 'ns_entities_employees', label: '員工', api: '/api/sync-employees', priority: '中' },
  { name: 'ns_ship_methods', label: '運送方式', api: '/api/sync-ship-methods', priority: '低' },
];

// 表名到路由的映射
const TABLE_ROUTES: Record<string, string> = {
  'ns_subsidiaries': 'subsidiaries',
  'ns_currencies': 'currencies',
  'ns_accounting_periods': 'accounting-periods',
  'ns_departments': 'departments',
  'ns_classes': 'classes',
  'ns_locations': 'locations',
  'ns_accounts': 'accounts',
  'ns_terms': 'terms',
  'ns_tax_codes': 'tax-codes',
  'ns_expense_categories': 'expense-categories',
  'ns_items': 'items',
  'ns_entities_customers': 'customers',
  'ns_entities_vendors': 'vendors',
  'ns_entities_employees': 'employees',
  'ns_ship_methods': 'ship-methods',
};

// 根據表名取得詳細頁面路由
function getTableDetailRoute(tableName: string): string | null {
  const route = TABLE_ROUTES[tableName];
  return route ? `/dashboard/ocr-expense/sync-status/${route}` : null;
}

type SortField = 'label' | 'tableName' | 'priority' | 'totalRecords' | 'lastSyncTime' | 'syncStatus';
type SortDirection = 'asc' | 'desc' | null;

export default function SyncStatusPage() {
  const [tableStatuses, setTableStatuses] = useState<TableSyncStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [syncActions, setSyncActions] = useState<Record<string, SyncAction>>({});
  const [syncingAll, setSyncingAll] = useState(false); // 是否正在執行全部同步
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // 載入所有表的同步狀態
  const loadSyncStatuses = async () => {
    setLoadingStatuses(true);
    try {
      const response = await fetch('/api/sync-status');
      const data = await response.json();
      
      if (data.success && data.data) {
        const formattedStatuses = data.data.map((item: any) => ({
          tableName: item.tableName,
          label: TABLE_CONFIG.find(t => t.name === item.tableName)?.label || item.tableName,
          success: item.success !== false,
          totalRecords: item.totalRecords || 0,
          lastSyncTime: item.lastSyncTime,
          lastUpdateTime: item.lastUpdateTime,
          error: item.error,
        }));
        setTableStatuses(formattedStatuses);
      }
    } catch (error: any) {
      console.error('載入同步狀態錯誤:', error);
    } finally {
      setLoadingStatuses(false);
    }
  };

  useEffect(() => {
    loadSyncStatuses();
  }, []);

  // 同步單個表
  const handleSyncTable = async (tableName: string, apiPath: string) => {
    setSyncActions(prev => ({
      ...prev,
      [tableName]: { tableName, syncing: true, pending: false, status: null, message: '' },
    }));

    try {
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      setSyncActions(prev => ({
        ...prev,
        [tableName]: {
          tableName,
          syncing: false,
          pending: false,
          status: response.ok && data.success ? 'success' : 'error',
          message: data.message || data.error || '同步失敗',
          data: data.data,
        },
      }));

      // 同步成功後重新載入狀態
      if (response.ok && data.success) {
        setTimeout(() => {
          loadSyncStatuses();
        }, 1000);
      }
    } catch (error: any) {
      setSyncActions(prev => ({
        ...prev,
        [tableName]: {
          tableName,
          syncing: false,
          pending: false,
          status: 'error',
          message: error.message || '網路連線錯誤',
        },
      }));
    }
  };

  // 全部同步：依序執行所有表的同步
  const handleSyncAll = async () => {
    if (syncingAll) return; // 如果正在執行全部同步，則不重複執行

    setSyncingAll(true);
    
    // 過濾掉停用的表
    const enabledTables = TABLE_CONFIG.filter(table => !table.disabled);
    
    // 初始化所有表的狀態為「待同步」
    const initialActions: Record<string, SyncAction> = {};
    enabledTables.forEach(table => {
      initialActions[table.name] = {
        tableName: table.name,
        syncing: false,
        pending: true,
        status: null,
        message: '待同步',
      };
    });
    setSyncActions(initialActions);

    // 依序執行每張表的同步
    for (let i = 0; i < enabledTables.length; i++) {
      const table = enabledTables[i];
      
      // 更新當前表為「同步中」
      setSyncActions(prev => ({
        ...prev,
        [table.name]: {
          ...prev[table.name],
          syncing: true,
          pending: false,
          message: '同步中...',
        },
      }));

      try {
        const response = await fetch(table.api, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        setSyncActions(prev => ({
          ...prev,
          [table.name]: {
            tableName: table.name,
            syncing: false,
            pending: false,
            status: response.ok && data.success ? 'success' : 'error',
            message: data.message || data.error || '同步失敗',
            data: data.data,
          },
        }));

        // 每張表之間稍作延遲，避免 API 壓力過大
        if (i < enabledTables.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        setSyncActions(prev => ({
          ...prev,
          [table.name]: {
            tableName: table.name,
            syncing: false,
            pending: false,
            status: 'error',
            message: error.message || '網路連線錯誤',
          },
        }));
      }
    }

    setSyncingAll(false);
    
    // 全部完成後重新載入狀態
    setTimeout(() => {
      loadSyncStatuses();
    }, 1500);
  };

  // 格式化時間
  const formatTime = (time: string | null) => {
    if (!time) return '從未同步';
    const date = new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleString('zh-TW');
  };

  // 獲取狀態顏色
  const getStatusColor = (status: TableSyncStatus) => {
    if (!status.success) return 'text-red-600 dark:text-red-400';
    if (!status.lastSyncTime) return 'text-gray-500 dark:text-gray-400';
    
    const syncTime = new Date(status.lastSyncTime);
    const now = new Date();
    const diffHours = (now.getTime() - syncTime.getTime()) / 3600000;
    
    if (diffHours < 24) return 'text-green-600 dark:text-green-400';
    if (diffHours < 168) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // 獲取同步狀態燈號
  const getSyncStatusLight = (tableName: string, syncAction: SyncAction | undefined, status: TableSyncStatus) => {
    // 如果正在同步中，顯示灰色（處理中）
    if (syncAction?.syncing) {
      return (
        <StatusLight status="pending" size={16} title="同步中..." />
      );
    }

    // 如果有同步記錄，優先使用同步記錄的狀態
    if (syncAction && syncAction.status !== null) {
      if (syncAction.status === 'success') {
        // 成功 → 綠燈
        return (
          <StatusLight 
            status="success" 
            size={16} 
            title={`上次同步成功: ${syncAction.message || '無訊息'}`} 
          />
        );
      } else if (syncAction.status === 'error') {
        // 失敗 → 紅燈
        return (
          <StatusLight 
            status="error" 
            size={16} 
            title={`上次同步失敗: ${syncAction.message || '未知錯誤'}`} 
          />
        );
      }
    }

    // 如果沒有同步記錄，根據資料狀態判斷
    // 檢查資料狀態（從 tableStatuses）
    if (!status.success) {
      // 資料查詢失敗 → 紅燈
      return (
        <StatusLight 
          status="error" 
          size={16} 
          title={`資料查詢失敗: ${status.error || '未知錯誤'}`} 
        />
      );
    }

    if (status.lastSyncTime) {
      // 有同步時間，檢查是否過期
      const syncTime = new Date(status.lastSyncTime);
      const now = new Date();
      const diffHours = (now.getTime() - syncTime.getTime()) / 3600000;
      
      if (diffHours > 168) {
        // 超過 7 天 → 紅燈（太久沒同步）
        return (
          <StatusLight status="error" size={16} title="超過 7 天未同步" />
        );
      } else if (diffHours > 24) {
        // 超過 1 天 → 黃燈（需要關注）
        return (
          <StatusLight status="warning" size={16} title="超過 1 天未同步" />
        );
      } else {
        // 24 小時內 → 綠燈（正常）
        return (
          <StatusLight status="success" size={16} title="同步狀態正常" />
        );
      }
    }

    // 沒有同步記錄 → 灰燈（從未同步）
    return (
      <StatusLight status="none" size={16} title="從未同步" />
    );
  };

  // 獲取同步狀態數值（用於排序）
  const getSyncStatusValue = (tableName: string, syncAction: SyncAction | undefined, status: TableSyncStatus): number => {
    // 排序順序：綠燈(3) > 黃燈(2) > 灰燈(1) > 紅燈(0)
    
    if (syncAction?.syncing) {
      return 1; // 處理中
    }

    if (syncAction) {
      if (syncAction.status === 'success') return 3; // 成功
      if (syncAction.status === 'error') return 0; // 失敗
    }

    if (!status.success) return 0; // 資料查詢失敗

    if (status.lastSyncTime) {
      const syncTime = new Date(status.lastSyncTime);
      const now = new Date();
      const diffHours = (now.getTime() - syncTime.getTime()) / 3600000;
      
      if (diffHours > 168) return 0; // 超過 7 天
      if (diffHours > 24) return 2; // 超過 1 天
      return 3; // 24 小時內
    }

    return 1; // 從未同步
  };

  // 處理排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 如果點擊同一個欄位，切換排序方向
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      // 點擊新欄位，設為升序
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 獲取排序圖標
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1 text-[#28363F] dark:text-[#5a7885]" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4 ml-1 text-[#28363F] dark:text-[#5a7885]" />;
    }
    return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
  };

  // 排序表格資料
  const getSortedTables = () => {
    if (!sortField || !sortDirection) {
      return TABLE_CONFIG;
    }

    return [...TABLE_CONFIG].sort((a, b) => {
      const statusA = tableStatuses.find(s => s.tableName === a.name) || {
        tableName: a.name,
        label: a.label,
        success: false,
        totalRecords: 0,
        lastSyncTime: null,
        lastUpdateTime: null,
      };
      const statusB = tableStatuses.find(s => s.tableName === b.name) || {
        tableName: b.name,
        label: b.label,
        success: false,
        totalRecords: 0,
        lastSyncTime: null,
        lastUpdateTime: null,
      };

      let valueA: any;
      let valueB: any;

      switch (sortField) {
        case 'label':
          valueA = statusA.label;
          valueB = statusB.label;
          break;
        case 'tableName':
          valueA = a.name;
          valueB = b.name;
          break;
        case 'priority':
          // 優先級排序：最高 > 高 > 中 > 低
          // 支援帶 emoji 的優先級（如 "🔴 最高"）
          const priorityOrder: Record<string, number> = { 
            '最高': 4, '🔴 最高': 4,
            '高': 3, '🔴 高': 3,
            '中': 2, '🟡 中': 2,
            '低': 1, '🟢 低': 1
          };
          // 提取優先級文字（移除 emoji）
          const getPriorityValue = (priority: string) => {
            const cleanPriority = priority.replace(/[🔴🟡🟢]/g, '').trim();
            return priorityOrder[priority] || priorityOrder[cleanPriority] || 0;
          };
          valueA = getPriorityValue(a.priority);
          valueB = getPriorityValue(b.priority);
          break;
        case 'totalRecords':
          valueA = statusA.totalRecords;
          valueB = statusB.totalRecords;
          break;
        case 'lastSyncTime':
          valueA = statusA.lastSyncTime ? new Date(statusA.lastSyncTime).getTime() : 0;
          valueB = statusB.lastSyncTime ? new Date(statusB.lastSyncTime).getTime() : 0;
          break;
        case 'syncStatus':
          const syncActionA = syncActions[a.name];
          const syncActionB = syncActions[b.name];
          valueA = getSyncStatusValue(a.name, syncActionA, statusA);
          valueB = getSyncStatusValue(b.name, syncActionB, statusB);
          break;
        default:
          return 0;
      }

      // 處理 null/undefined 值
      if (valueA == null) valueA = sortDirection === 'asc' ? Infinity : -Infinity;
      if (valueB == null) valueB = sortDirection === 'asc' ? Infinity : -Infinity;

      // 字串比較
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB, 'zh-TW')
          : valueB.localeCompare(valueA, 'zh-TW');
      }

      // 數值比較
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-[#28363F] dark:text-[#5a7885]" />
          <h1 className="text-3xl font-bold text-foreground">NetSuite 資料同步狀態</h1>
        </div>
        <p className="text-muted-foreground">
          直接從 Next.js API 連接到 NetSuite，使用 SuiteQL 查詢並將資料寫入 Supabase
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-[#28363F] dark:text-[#5a7885]" />
                <div>
                  <CardTitle>同步狀態總覽</CardTitle>
                  <CardDescription className="mt-1">
                    查看所有 NetSuite 主檔表的同步狀態和記錄數
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleSyncAll}
                disabled={loadingStatuses || syncingAll}
                variant="default"
                size="sm"
                className="bg-[#28363F] hover:bg-[#354a56] text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncingAll ? 'animate-spin' : ''}`} />
                {syncingAll ? '同步中...' : '全部同步'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStatuses ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">載入中...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">
                        <button
                          onClick={() => handleSort('syncStatus')}
                          className="flex items-center hover:text-[#28363F] dark:hover:text-[#5a7885] transition-colors"
                        >
                          同步狀態
                          {getSortIcon('syncStatus')}
                        </button>
                      </TableHead>
                      <TableHead className="w-[200px]">
                        <button
                          onClick={() => handleSort('label')}
                          className="flex items-center hover:text-[#28363F] dark:hover:text-[#5a7885] transition-colors"
                        >
                          表名稱
                          {getSortIcon('label')}
                        </button>
                      </TableHead>
                      <TableHead className="w-[180px]">
                        <button
                          onClick={() => handleSort('tableName')}
                          className="flex items-center hover:text-[#28363F] dark:hover:text-[#5a7885] transition-colors"
                        >
                          資料庫表名
                          {getSortIcon('tableName')}
                        </button>
                      </TableHead>
                      <TableHead className="w-[100px]">
                        <button
                          onClick={() => handleSort('priority')}
                          className="flex items-center hover:text-[#28363F] dark:hover:text-[#5a7885] transition-colors"
                        >
                          優先級
                          {getSortIcon('priority')}
                        </button>
                      </TableHead>
                      <TableHead className="w-[120px]">
                        <button
                          onClick={() => handleSort('totalRecords')}
                          className="flex items-center justify-end w-full hover:text-[#28363F] dark:hover:text-[#5a7885] transition-colors"
                        >
                          記錄數
                          {getSortIcon('totalRecords')}
                        </button>
                      </TableHead>
                      <TableHead className="w-[180px]">
                        <button
                          onClick={() => handleSort('lastSyncTime')}
                          className="flex items-center hover:text-[#28363F] dark:hover:text-[#5a7885] transition-colors"
                        >
                          最後同步時間
                          {getSortIcon('lastSyncTime')}
                        </button>
                      </TableHead>
                      <TableHead className="w-[120px]">
                        <div className="flex justify-end">操作</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSortedTables().map((table) => {
                      const status = tableStatuses.find(s => s.tableName === table.name) || {
                        tableName: table.name,
                        label: table.label,
                        success: false,
                        totalRecords: 0,
                        lastSyncTime: null,
                        lastUpdateTime: null,
                      };
                      const syncAction = syncActions[table.name];
                      const isSyncing = syncAction?.syncing || false;
                      const isPending = syncAction?.pending || false;

                      return (
                        <TableRow key={table.name}>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {getSyncStatusLight(table.name, syncAction, status)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {status.label}
                          </TableCell>
                          <TableCell>
                            {getTableDetailRoute(table.name) ? (
                              <Link
                                href={getTableDetailRoute(table.name)!}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <code className="text-xs bg-gray-100 dark:bg-[#3a4f5d] px-2 py-1 rounded font-mono">
                                  {table.name}
                                </code>
                              </Link>
                            ) : (
                              <code className="text-xs bg-gray-100 dark:bg-[#3a4f5d] px-2 py-1 rounded font-mono">
                                {table.name}
                              </code>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">{table.priority}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              {status.totalRecords > 0 ? (
                                <span className="font-medium">{status.totalRecords.toLocaleString()}</span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-foreground" />
                              <span className="text-foreground">{formatTime(status.lastSyncTime)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              <Button
                                onClick={() => handleSyncTable(table.name, table.api)}
                                disabled={isSyncing || isPending || table.disabled || syncingAll}
                                size="sm"
                                variant="outline"
                                className={`${
                                  table.disabled
                                    ? 'bg-gray-100 dark:bg-muted text-gray-400 dark:text-muted-foreground cursor-not-allowed'
                                    : isPending
                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700'
                                    : 'bg-[#28363F] hover:bg-[#354a56] text-white border-[#28363F]'
                                }`}
                                title={table.disabled ? table.disabledReason : isPending ? '等待同步中...' : ''}
                              >
                                {isSyncing ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    同步中
                                  </>
                                ) : isPending ? (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    待同步
                                  </>
                                ) : table.disabled ? (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    不支援
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    同步
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* 同步結果訊息 */}
            {Object.values(syncActions).map((action) => {
              if (!action.status) return null;
              const tableConfig = TABLE_CONFIG.find(t => t.name === action.tableName);
              
              return (
                <div
                  key={action.tableName}
                  className={`mt-4 flex items-start gap-3 p-4 rounded-lg border ${
                    action.status === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  {action.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      action.status === 'success'
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {tableConfig?.label || action.tableName} - {action.status === 'success' ? '同步成功' : '同步失敗'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      action.status === 'success'
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {action.message}
                    </p>
                    {action.data && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                        <p>總記錄數: {action.data.totalRecords}</p>
                        <p>寫入記錄數: {action.data.upsertedRecords}</p>
                        <p>耗時: {action.data.timeTaken}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 說明文字 */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    • 優先級說明：最高（基礎主檔）、中（組織架構）、低（可延後建立）
                  </p>
                  <p>
                    • 建議按照優先級順序同步：先同步基礎主檔（公司別、幣別），再同步其他表
                  </p>
                  <p>
                    • 同步時間顏色：綠色（24小時內）、黃色（7天內）、紅色（超過7天或錯誤）
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

