'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Play, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface SyncLog {
  id: string;
  table_name: string;
  sync_type: string;
  sync_status: string;
  records_processed?: number;
  records_inserted?: number;
  records_updated?: number;
  sync_started_at?: string;
  sync_completed_at?: string;
  error_message?: string;
}

interface TableMapping {
  mapping_key: string;
  label: string;
  supabase_table_name: string;
  is_enabled: boolean;
}

export default function N8nSyncPage() {
  const [tableMappings, setTableMappings] = useState<TableMapping[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // 載入表映射配置
  const loadTableMappings = async () => {
    try {
      const response = await fetch('/api/table-mapping');
      const result = await response.json();

      if (result.success) {
        setTableMappings(result.data.mappings || []);
      }
    } catch (error: any) {
      console.error('載入表映射失敗:', error);
    }
  };

  // 載入同步日誌
  const loadSyncLogs = async () => {
    try {
      const response = await fetch('/api/trigger-n8n-sync');
      const result = await response.json();

      if (result.success) {
        setSyncLogs(result.data.recentSyncs || []);
      }
    } catch (error: any) {
      console.error('載入同步日誌失敗:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadTableMappings(), loadSyncLogs()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // 觸發同步
  const triggerSync = async (mappingKey: string, syncType: string = 'full') => {
    setSyncing((prev) => new Set(prev).add(mappingKey));
    setAlert(null);

    try {
      const response = await fetch('/api/trigger-n8n-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappingKey, syncType }),
      });

      const result = await response.json();

      if (result.success) {
        setAlert({
          type: 'success',
          message: `同步任務已觸發：${mappingKey}`,
        });
        // 延遲後重新載入日誌
        setTimeout(() => {
          loadSyncLogs();
        }, 2000);
      } else {
        setAlert({ type: 'error', message: result.error || '觸發失敗' });
      }
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || '觸發失敗' });
    } finally {
      setSyncing((prev) => {
        const newSet = new Set(prev);
        newSet.delete(mappingKey);
        return newSet;
      });
    }
  };

  // 取得同步狀態的 Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">成功</Badge>;
      case 'failed':
        return <Badge variant="destructive">失敗</Badge>;
      case 'pending':
        return <Badge variant="secondary">進行中</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 取得同步狀態的圖示
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6 bg-muted/25">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">n8n 同步管理</h1>
          <p className="text-muted-foreground mt-2">
            觸發和管理 NetSuite 資料同步任務
          </p>
        </div>
        <Button onClick={() => loadSyncLogs()} variant="outline" disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          重新載入
        </Button>
      </div>

      {alert && (
        <Alert
          variant={alert.type === 'error' ? 'destructive' : 'default'}
          className={
            alert.type === 'success'
              ? 'border-green-500 bg-green-50'
              : alert.type === 'error'
              ? 'border-red-500 bg-red-50'
              : 'border-blue-500 bg-blue-50'
          }
        >
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* 表列表 */}
      <Card>
        <CardHeader>
          <CardTitle>可同步的表</CardTitle>
          <CardDescription>選擇要同步的表並觸發同步任務</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            (() => {
              const enabledMappings = tableMappings.filter((m) => m.is_enabled);
              if (enabledMappings.length === 0) {
                return (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>尚無可同步的表</p>
                    <p className="text-sm mt-2">
                      {tableMappings.length === 0
                        ? '請確認 table_mapping_config 表中是否有資料，且 is_enabled = true'
                        : '所有表都已被停用，請檢查 table_mapping_config 表的 is_enabled 欄位'}
                    </p>
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enabledMappings.map((mapping) => (
                    <div
                      key={mapping.mapping_key}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{mapping.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {mapping.supabase_table_name}
                        </div>
                      </div>
                      <Button
                        onClick={() => triggerSync(mapping.mapping_key, 'full')}
                        disabled={syncing.has(mapping.mapping_key)}
                        size="sm"
                      >
                        {syncing.has(mapping.mapping_key) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            同步中
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            同步
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </CardContent>
      </Card>

      {/* 同步日誌 */}
      <Card>
        <CardHeader>
          <CardTitle>同步日誌</CardTitle>
          <CardDescription>最近的同步執行記錄</CardDescription>
        </CardHeader>
        <CardContent>
          {syncLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              尚無同步記錄
            </div>
          ) : (
            <div className="space-y-4">
              {syncLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(log.sync_status)}
                    <div className="flex-1">
                      <div className="font-medium">{log.table_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.sync_type === 'full' ? '全量同步' : '增量同步'}
                        {log.records_processed !== undefined &&
                          ` • 處理 ${log.records_processed} 筆`}
                        {log.records_inserted !== undefined &&
                          ` • 新增 ${log.records_inserted} 筆`}
                        {log.records_updated !== undefined &&
                          ` • 更新 ${log.records_updated} 筆`}
                      </div>
                      {log.sync_started_at && (
                        <div className="text-xs text-muted-foreground mt-1">
                          開始時間：{new Date(log.sync_started_at).toLocaleString('zh-TW')}
                          {log.sync_completed_at &&
                            ` • 完成時間：${new Date(log.sync_completed_at).toLocaleString('zh-TW')}`}
                        </div>
                      )}
                      {log.error_message && (
                        <div className="text-sm text-red-500 mt-1">
                          錯誤：{log.error_message}
                        </div>
                      )}
                    </div>
                    <div>{getStatusBadge(log.sync_status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

