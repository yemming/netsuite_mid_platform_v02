'use client';

import { useState, useEffect } from 'react';
import { Settings, Database, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  description: string | null;
  setting_type: string;
  is_sensitive: boolean;
}

export default function SettingsPage() {
  const [tableStatuses, setTableStatuses] = useState<TableSyncStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [syncActions, setSyncActions] = useState<Record<string, SyncAction>>({});
  
  // 系統設定相關 state
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState<Record<string, boolean>>({});
  const [settingValues, setSettingValues] = useState<Record<string, string>>({});

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

  // 載入系統設定
  const loadSystemSettings = async () => {
    setLoadingSettings(true);
    try {
      const response = await fetch('/api/system-settings');
      const data = await response.json();
      
      console.log('系統設定 API 回應:', data);
      
      if (data.success && data.data) {
        setSystemSettings(data.data);
        // 初始化設定值
        const values: Record<string, string> = {};
        data.data.forEach((setting: SystemSetting) => {
          values[setting.setting_key] = setting.setting_value || '';
        });
        setSettingValues(values);
      } else if (data.error) {
        console.error('載入系統設定錯誤:', data.error);
        alert(`載入設定失敗: ${data.error}${data.details ? '\n' + data.details : ''}`);
      }
    } catch (error: any) {
      console.error('載入系統設定錯誤:', error);
      alert(`載入設定失敗: ${error.message}`);
    } finally {
      setLoadingSettings(false);
    }
  };

  // 更新系統設定
  const handleSaveSetting = async (key: string) => {
    setSavingSettings(prev => ({ ...prev, [key]: true }));
    try {
      const response = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value: settingValues[key] || '',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 更新本地狀態
        setSystemSettings(prev => 
          prev.map(setting => 
            setting.setting_key === key
              ? { ...setting, setting_value: settingValues[key] || null }
              : setting
          )
        );
        alert('設定已儲存');
      } else {
        alert(`儲存失敗: ${data.error}`);
      }
    } catch (error: any) {
      console.error('儲存設定錯誤:', error);
      alert(`儲存失敗: ${error.message}`);
    } finally {
      setSavingSettings(prev => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    loadSyncStatuses();
    loadSystemSettings();
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
          <Settings className="h-8 w-8 text-[#28363F] dark:text-[#5a7885]" />
          <h1 className="text-3xl font-bold text-foreground">設定</h1>
        </div>
        <p className="text-muted-foreground">
          管理您的系統設定和資料同步選項
        </p>
      </div>

      <div className="space-y-6">
        {/* NetSuite 資料同步狀態 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-[#28363F] dark:text-[#5a7885]" />
                <div>
                  <CardTitle>NetSuite 資料同步狀態</CardTitle>
                  <CardDescription className="mt-1">
                    直接從 Next.js API 連接到 NetSuite，使用 SuiteQL 查詢並將資料寫入 Supabase
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
                          <TableCell className="font-medium">{status.label}</TableCell>
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

        {/* 系統設定 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-[#28363F] dark:text-[#5a7885]" />
                <div>
                  <CardTitle>系統設定</CardTitle>
                  <CardDescription className="mt-1">
                    管理系統各種設定值
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={loadSystemSettings}
                disabled={loadingSettings}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingSettings ? 'animate-spin' : ''}`} />
                重新整理
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSettings ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">載入中...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {systemSettings.length > 0 ? (
                  systemSettings.map((setting) => (
                    <div key={setting.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={setting.setting_key} className="text-sm font-medium">
                          {setting.setting_key}
                        </Label>
                        <Button
                          onClick={() => handleSaveSetting(setting.setting_key)}
                          disabled={savingSettings[setting.setting_key]}
                          size="sm"
                          variant="outline"
                          className="bg-[#28363F] hover:bg-[#354a56] text-white border-[#28363F]"
                        >
                          {savingSettings[setting.setting_key] ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              儲存中
                            </>
                          ) : (
                            <>
                              <Save className="h-3 w-3 mr-1" />
                              儲存
                            </>
                          )}
                        </Button>
                      </div>
                      {setting.description && (
                        <p className="text-xs text-muted-foreground">{setting.description}</p>
                      )}
                      <Input
                        id={setting.setting_key}
                        type={setting.setting_type === 'url' ? 'url' : 'text'}
                        value={settingValues[setting.setting_key] || ''}
                        onChange={(e) => setSettingValues(prev => ({
                          ...prev,
                          [setting.setting_key]: e.target.value,
                        }))}
                        placeholder={`請輸入 ${setting.setting_key}`}
                        className="w-full"
                      />
                    </div>
                  ))
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-8 text-muted-foreground">
                      目前沒有系統設定
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                          <p className="font-medium mb-1">尚未建立系統設定表</p>
                          <p className="text-xs">
                            請在 Supabase Dashboard → SQL Editor 執行 <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">create_system_settings_table.sql</code> 來建立資料表
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
