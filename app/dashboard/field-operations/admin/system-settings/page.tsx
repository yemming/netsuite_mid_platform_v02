'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Save,
  RefreshCw
} from 'lucide-react';

export default function SystemSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    // GPS 相關設定
    gpsUpdateInterval: '30', // 秒
    gpsAccuracyThreshold: '10', // 公尺
    enableAutoLocationUpdate: true,
    
    // 工單相關設定
    defaultWorkOrderPriority: 'medium',
    autoAssignTechnician: false,
    workOrderExpiryDays: '30',
    
    // 通知相關設定
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    notificationEmail: '',
    
    // 系統相關設定
    sessionTimeout: '60', // 分鐘
    maxUploadFileSize: '5', // MB
    enableAuditLog: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: 實作儲存到後端的邏輯
      // 模擬 API 呼叫
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 儲存成功後，返回上一頁
      router.back();
      // 等待導航完成後重新整理上一頁
      setTimeout(() => {
        router.refresh();
      }, 200);
    } catch (error) {
      console.error('儲存設定失敗:', error);
      alert('儲存失敗，請稍後再試');
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('確定要重置為預設值嗎？')) {
      setSettings({
        gpsUpdateInterval: '30',
        gpsAccuracyThreshold: '10',
        enableAutoLocationUpdate: true,
        defaultWorkOrderPriority: 'medium',
        autoAssignTechnician: false,
        workOrderExpiryDays: '30',
        enableEmailNotifications: true,
        enableSMSNotifications: false,
        notificationEmail: '',
        sessionTimeout: '60',
        maxUploadFileSize: '5',
        enableAuditLog: true,
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            系統參數設定
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            管理系統的各種參數和設定選項
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重置為預設值
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? '儲存中...' : '儲存設定'}
          </Button>
        </div>
      </div>

      {/* GPS 設定 */}
      <Card>
        <CardHeader>
          <CardTitle>GPS 位置設定</CardTitle>
          <CardDescription>
            設定人員 GPS 位置的更新頻率和準確度要求
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gpsUpdateInterval">GPS 更新間隔（秒）</Label>
            <Input
              id="gpsUpdateInterval"
              type="number"
              value={settings.gpsUpdateInterval}
              onChange={(e) => handleChange('gpsUpdateInterval', e.target.value)}
              min="10"
              max="300"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              建議值：30-60 秒，過於頻繁可能影響電池續航
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gpsAccuracyThreshold">GPS 準確度閾值（公尺）</Label>
            <Input
              id="gpsAccuracyThreshold"
              type="number"
              value={settings.gpsAccuracyThreshold}
              onChange={(e) => handleChange('gpsAccuracyThreshold', e.target.value)}
              min="5"
              max="100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              只有當 GPS 準確度優於此值時才會更新位置
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enableAutoLocationUpdate"
              checked={settings.enableAutoLocationUpdate}
              onChange={(e) => handleChange('enableAutoLocationUpdate', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="enableAutoLocationUpdate" className="cursor-pointer">
              自動更新人員位置（登入行動現場服務頁面時）
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* 工單設定 */}
      <Card>
        <CardHeader>
          <CardTitle>工單管理設定</CardTitle>
          <CardDescription>
            設定工單的預設值和自動化選項
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultWorkOrderPriority">預設工單優先級</Label>
            <select
              id="defaultWorkOrderPriority"
              value={settings.defaultWorkOrderPriority}
              onChange={(e) => handleChange('defaultWorkOrderPriority', e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">緊急</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="workOrderExpiryDays">工單過期天數</Label>
            <Input
              id="workOrderExpiryDays"
              type="number"
              value={settings.workOrderExpiryDays}
              onChange={(e) => handleChange('workOrderExpiryDays', e.target.value)}
              min="1"
              max="365"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              超過此天數未完成的工單將被標記為過期
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoAssignTechnician"
              checked={settings.autoAssignTechnician}
              onChange={(e) => handleChange('autoAssignTechnician', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="autoAssignTechnician" className="cursor-pointer">
              自動分配技術人員（根據技能和位置）
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* 通知設定 */}
      <Card>
        <CardHeader>
          <CardTitle>通知設定</CardTitle>
          <CardDescription>
            設定系統通知的方式和接收者
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enableEmailNotifications"
              checked={settings.enableEmailNotifications}
              onChange={(e) => handleChange('enableEmailNotifications', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="enableEmailNotifications" className="cursor-pointer">
              啟用電子郵件通知
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enableSMSNotifications"
              checked={settings.enableSMSNotifications}
              onChange={(e) => handleChange('enableSMSNotifications', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="enableSMSNotifications" className="cursor-pointer">
              啟用簡訊通知
            </Label>
          </div>
          {settings.enableEmailNotifications && (
            <div className="space-y-2">
              <Label htmlFor="notificationEmail">通知電子郵件</Label>
              <Input
                id="notificationEmail"
                type="email"
                value={settings.notificationEmail}
                onChange={(e) => handleChange('notificationEmail', e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 系統設定 */}
      <Card>
        <CardHeader>
          <CardTitle>系統設定</CardTitle>
          <CardDescription>
            系統層級的設定選項
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">工作階段逾時時間（分鐘）</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => handleChange('sessionTimeout', e.target.value)}
              min="15"
              max="480"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxUploadFileSize">最大上傳檔案大小（MB）</Label>
            <Input
              id="maxUploadFileSize"
              type="number"
              value={settings.maxUploadFileSize}
              onChange={(e) => handleChange('maxUploadFileSize', e.target.value)}
              min="1"
              max="100"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enableAuditLog"
              checked={settings.enableAuditLog}
              onChange={(e) => handleChange('enableAuditLog', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="enableAuditLog" className="cursor-pointer">
              啟用審計日誌（記錄所有重要操作）
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

