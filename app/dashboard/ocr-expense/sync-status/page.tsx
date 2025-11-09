'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
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
  status: 'success' | 'error' | null;
  message: string;
  data?: any;
}

const TABLE_CONFIG = [
  { name: 'ns_subsidiaries', label: '公司別', api: '/api/sync-subsidiaries', priority: '🔴 最高' },
  { name: 'ns_currencies', label: '幣別', api: '/api/sync-currencies', priority: '🔴 最高' },
  { name: 'ns_accounting_periods', label: '會計期間', api: '/api/sync-accounting-periods', priority: '🔴 最高', disabled: true, disabledReason: 'SuiteQL 不支援' },
  { name: 'ns_departments', label: '部門', api: '/api/sync-departments', priority: '🟡 中' },
  { name: 'ns_classes', label: '類別', api: '/api/sync-classes', priority: '🟡 中' },
  { name: 'ns_locations', label: '地點', api: '/api/sync-locations', priority: '🟡 中' },
  { name: 'ns_accounts', label: '會計科目', api: '/api/sync-accounts', priority: '🟡 中' },
  { name: 'ns_terms', label: '付款條件', api: '/api/sync-terms', priority: '🟢 低' },
  { name: 'ns_tax_codes', label: '稅碼', api: '/api/sync-tax-codes', priority: '🔴 高' },
  { name: 'ns_expense_categories', label: '費用類別', api: '/api/sync-expense-categories', priority: '🟡 中' },
  { name: 'ns_items', label: '產品主檔', api: '/api/sync-items', priority: '🔴 最高' },
  { name: 'ns_entities_customers', label: '客戶', api: '/api/sync-customers', priority: '🔴 高' },
  { name: 'ns_entities_vendors', label: '供應商', api: '/api/sync-vendors', priority: '🟡 中' },
  { name: 'ns_entities_employees', label: '員工', api: '/api/sync-employees', priority: '🟡 中' },
  { name: 'ns_ship_methods', label: '運送方式', api: '/api/sync-ship-methods', priority: '🟢 低' },
];

export default function SyncStatusPage() {
  const [tableStatuses, setTableStatuses] = useState<TableSyncStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [syncActions, setSyncActions] = useState<Record<string, SyncAction>>({});

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
      [tableName]: { tableName, syncing: true, status: null, message: '' },
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
          status: 'error',
          message: error.message || '網路連線錯誤',
        },
      }));
    }
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
                onClick={loadSyncStatuses}
                disabled={loadingStatuses}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingStatuses ? 'animate-spin' : ''}`} />
                重新整理
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
                      <TableHead className="w-[200px]">表名稱</TableHead>
                      <TableHead className="w-[100px]">優先級</TableHead>
                      <TableHead className="w-[120px]">
                        <div className="flex justify-end">記錄數</div>
                      </TableHead>
                      <TableHead className="w-[180px]">最後同步時間</TableHead>
                      <TableHead className="w-[180px]">最後更新時間</TableHead>
                      <TableHead className="w-[120px]">
                        <div className="flex justify-end">操作</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TABLE_CONFIG.map((table) => {
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

                      return (
                        <TableRow key={table.name}>
                          <TableCell className="font-medium">
                            {table.name === 'ns_subsidiaries' ? (
                              <Link
                                href="/dashboard/ocr-expense/sync-status/subsidiaries"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {status.label}
                              </Link>
                            ) : (
                              status.label
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
                              <Clock className={`h-4 w-4 ${getStatusColor(status)}`} />
                              <span className={getStatusColor(status)}>{formatTime(status.lastSyncTime)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatTime(status.lastUpdateTime)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              <Button
                                onClick={() => handleSyncTable(table.name, table.api)}
                                disabled={isSyncing || table.disabled}
                                size="sm"
                                variant="outline"
                                className={`${
                                  table.disabled
                                    ? 'bg-gray-100 dark:bg-muted text-gray-400 dark:text-muted-foreground cursor-not-allowed'
                                    : 'bg-[#28363F] hover:bg-[#354a56] text-white border-[#28363F]'
                                }`}
                                title={table.disabled ? table.disabledReason : ''}
                              >
                                {isSyncing ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    同步中
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
                    • 優先級說明：🔴 最高（基礎主檔）、🟡 中（組織架構）、🟢 低（可延後建立）
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

