'use client';

import { useState } from 'react';
import { Settings, Database, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSyncNetSuiteToSupabase = async () => {
    setSyncing(true);
    setSyncStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/sync-netsuite-to-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSyncStatus({
          type: 'success',
          message: data.message || '同步請求已成功發送到 N8N',
        });
      } else {
        setSyncStatus({
          type: 'error',
          message: data.message || data.error || '同步失敗，請稍後再試',
        });
      }
    } catch (error: any) {
      console.error('同步錯誤:', error);
      setSyncStatus({
        type: 'error',
        message: error.message || '網路連線錯誤，請檢查網路連線',
      });
    } finally {
      setSyncing(false);
    }
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
        {/* 同步 NetSuite 到 Supabase 設定 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-[#28363F] dark:text-[#5a7885]" />
              <div>
                <CardTitle>同步 NetSuite 資料到 Supabase</CardTitle>
                <CardDescription className="mt-1">
                  將 NetSuite 設定好的資料組檔備份到 Supabase 資料庫
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleSyncNetSuiteToSupabase}
                disabled={syncing}
                className="bg-[#28363F] hover:bg-[#354a56] text-white"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    同步中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    開始同步
                  </>
                )}
              </Button>
            </div>

            {/* 狀態訊息 */}
            {syncStatus.type && (
              <div
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  syncStatus.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                {syncStatus.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      syncStatus.type === 'success'
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}
                  >
                    {syncStatus.type === 'success' ? '同步成功' : '同步失敗'}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      syncStatus.type === 'success'
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}
                  >
                    {syncStatus.message}
                  </p>
                </div>
              </div>
            )}

            {/* 說明文字 */}
            <div className="pt-2 border-t">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  點擊「開始同步」按鈕後，系統會呼叫 N8N Webhook 來執行資料同步作業。
                  同步過程可能需要一些時間，請耐心等候。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

