'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, RefreshCw, Store, Printer, CreditCard, Bell, Shield, Globe, Database, Trash2 } from 'lucide-react';
import { posDB } from '@/lib/indexeddb-pos';
import { productData } from '../products-data';

export default function POSSettingsPage() {
  // 門市資訊設定
  const [storeInfo, setStoreInfo] = useState({
    storeName: '台北信義店',
    storeCode: 'STORE-001',
    address: '台北市信義區信義路五段7號',
    phone: '02-2345-6789',
    taxId: '12345678',
  });

  // 收銀機設定
  const [posSettings, setPosSettings] = useState({
    autoPrint: true,
    printReceipt: true,
    printCustomerCopy: true,
    printMerchantCopy: true,
    allowDiscount: true,
    allowManualPrice: false,
    requireManagerAuth: true,
    autoLogout: true,
    logoutTimeout: 30, // 分鐘
  });

  // 付款方式設定
  const [paymentSettings, setPaymentSettings] = useState({
    cashEnabled: true,
    creditCardEnabled: true,
    linePayEnabled: true,
    allowSplitPayment: true,
    allowPartialPayment: false,
    defaultPaymentMethod: 'cash',
  });

  // 列印設定
  const [printSettings, setPrintSettings] = useState({
    printerName: 'EPSON TM-T82',
    paperSize: '80mm',
    printLogo: true,
    printQRCode: true,
    printFooter: true,
    footerText: '感謝您的光臨！',
  });

  // 通知設定
  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlert: true,
    lowStockThreshold: 10,
    salesAlert: true,
    errorAlert: true,
    soundEnabled: true,
  });

  // 儲存設定
  const handleSave = async (section: string) => {
    try {
      // 模擬 API 呼叫
      console.log(`儲存 ${section} 設定:`, {
        storeInfo,
        posSettings,
        paymentSettings,
        printSettings,
        notificationSettings,
      });
      
      alert(`${section} 設定已儲存成功！`);
    } catch (error) {
      alert('儲存失敗，請重試');
      console.error(error);
    }
  };

  // 重置設定
  const handleReset = (section: string) => {
    if (confirm(`確定要重置 ${section} 設定嗎？`)) {
      // 重置邏輯
      alert(`${section} 設定已重置`);
    }
  };

  // 重置商品資料
  const handleResetProducts = async () => {
    if (confirm('確定要清空所有商品資料並重新初始化嗎？這將刪除所有現有商品，並載入新的240個商品。')) {
      try {
        // 取得所有現有商品並逐個刪除
        const allItems = await posDB.getAllItems();
        for (const item of allItems) {
          if (item.id) {
            await posDB.deleteItem(item.id);
          }
        }
        // 載入新商品
        for (const item of productData) {
          await posDB.upsertItem(item);
        }
        alert('資料庫已清空並重新初始化！');
      } catch (error) {
        console.error('清空資料庫失敗:', error);
        alert('清空資料庫失敗，請重試');
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">POS設定</h1>
          <p className="text-gray-500 mt-1">管理 POS 系統相關設定</p>
        </div>
      </div>

      {/* 門市資訊設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              <CardTitle>門市資訊</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleReset('門市資訊')}>
                <RefreshCw className="mr-2 h-4 w-4" />
                重置
              </Button>
              <Button size="sm" onClick={() => handleSave('門市資訊')}>
                <Save className="mr-2 h-4 w-4" />
                儲存
              </Button>
            </div>
          </div>
          <CardDescription>設定門市基本資訊</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>門市名稱 <span className="text-red-500">*</span></Label>
              <Input
                value={storeInfo.storeName}
                onChange={(e) => setStoreInfo({ ...storeInfo, storeName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>門市代碼 <span className="text-red-500">*</span></Label>
              <Input
                value={storeInfo.storeCode}
                onChange={(e) => setStoreInfo({ ...storeInfo, storeCode: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>地址</Label>
              <Input
                value={storeInfo.address}
                onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>電話</Label>
              <Input
                value={storeInfo.phone}
                onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>統一編號</Label>
              <Input
                value={storeInfo.taxId}
                onChange={(e) => setStoreInfo({ ...storeInfo, taxId: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 收銀機設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>收銀機設定</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleReset('收銀機設定')}>
                <RefreshCw className="mr-2 h-4 w-4" />
                重置
              </Button>
              <Button size="sm" onClick={() => handleSave('收銀機設定')}>
                <Save className="mr-2 h-4 w-4" />
                儲存
              </Button>
            </div>
          </div>
          <CardDescription>設定收銀機操作相關選項</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>自動列印</Label>
                <p className="text-sm text-gray-500">交易完成後自動列印收據</p>
              </div>
              <Switch
                checked={posSettings.autoPrint}
                onCheckedChange={(checked) => setPosSettings({ ...posSettings, autoPrint: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>列印客戶聯</Label>
                <p className="text-sm text-gray-500">列印給客戶的收據</p>
              </div>
              <Switch
                checked={posSettings.printCustomerCopy}
                onCheckedChange={(checked) => setPosSettings({ ...posSettings, printCustomerCopy: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>列印存根聯</Label>
                <p className="text-sm text-gray-500">列印店家保留的存根</p>
              </div>
              <Switch
                checked={posSettings.printMerchantCopy}
                onCheckedChange={(checked) => setPosSettings({ ...posSettings, printMerchantCopy: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>允許折扣</Label>
                <p className="text-sm text-gray-500">允許對商品進行折扣</p>
              </div>
              <Switch
                checked={posSettings.allowDiscount}
                onCheckedChange={(checked) => setPosSettings({ ...posSettings, allowDiscount: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>允許手動改價</Label>
                <p className="text-sm text-gray-500">允許手動修改商品價格（需主管授權）</p>
              </div>
              <Switch
                checked={posSettings.allowManualPrice}
                onCheckedChange={(checked) => setPosSettings({ ...posSettings, allowManualPrice: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>需要主管授權</Label>
                <p className="text-sm text-gray-500">特定操作需要主管授權</p>
              </div>
              <Switch
                checked={posSettings.requireManagerAuth}
                onCheckedChange={(checked) => setPosSettings({ ...posSettings, requireManagerAuth: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>自動登出</Label>
                <p className="text-sm text-gray-500">閒置一段時間後自動登出</p>
              </div>
              <Switch
                checked={posSettings.autoLogout}
                onCheckedChange={(checked) => setPosSettings({ ...posSettings, autoLogout: checked })}
              />
            </div>
            {posSettings.autoLogout && (
              <div className="space-y-2 pl-4">
                <Label>登出時間（分鐘）</Label>
                <Input
                  type="number"
                  value={posSettings.logoutTimeout}
                  onChange={(e) => setPosSettings({ ...posSettings, logoutTimeout: parseInt(e.target.value) || 30 })}
                  min="1"
                  max="120"
                  className="w-32"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 付款方式設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>付款方式設定</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleReset('付款方式設定')}>
                <RefreshCw className="mr-2 h-4 w-4" />
                重置
              </Button>
              <Button size="sm" onClick={() => handleSave('付款方式設定')}>
                <Save className="mr-2 h-4 w-4" />
                儲存
              </Button>
            </div>
          </div>
          <CardDescription>設定可用的付款方式</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>現金付款</Label>
                <p className="text-sm text-gray-500">啟用現金付款功能</p>
              </div>
              <Switch
                checked={paymentSettings.cashEnabled}
                onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, cashEnabled: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>信用卡付款</Label>
                <p className="text-sm text-gray-500">啟用信用卡付款功能</p>
              </div>
              <Switch
                checked={paymentSettings.creditCardEnabled}
                onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, creditCardEnabled: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>LINE Pay</Label>
                <p className="text-sm text-gray-500">啟用 LINE Pay 付款功能</p>
              </div>
              <Switch
                checked={paymentSettings.linePayEnabled}
                onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, linePayEnabled: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>允許分單付款</Label>
                <p className="text-sm text-gray-500">允許一筆交易使用多種付款方式</p>
              </div>
              <Switch
                checked={paymentSettings.allowSplitPayment}
                onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, allowSplitPayment: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>允許部分付款</Label>
                <p className="text-sm text-gray-500">允許付款金額小於應付金額</p>
              </div>
              <Switch
                checked={paymentSettings.allowPartialPayment}
                onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, allowPartialPayment: checked })}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>預設付款方式</Label>
              <Select
                value={paymentSettings.defaultPaymentMethod}
                onValueChange={(value) => setPaymentSettings({ ...paymentSettings, defaultPaymentMethod: value })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">現金</SelectItem>
                  <SelectItem value="creditCard">信用卡</SelectItem>
                  <SelectItem value="linePay">LINE Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 列印設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              <CardTitle>列印設定</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleReset('列印設定')}>
                <RefreshCw className="mr-2 h-4 w-4" />
                重置
              </Button>
              <Button size="sm" onClick={() => handleSave('列印設定')}>
                <Save className="mr-2 h-4 w-4" />
                儲存
              </Button>
            </div>
          </div>
          <CardDescription>設定收據列印相關選項</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>印表機名稱</Label>
              <Input
                value={printSettings.printerName}
                onChange={(e) => setPrintSettings({ ...printSettings, printerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>紙張大小</Label>
              <Select
                value={printSettings.paperSize}
                onValueChange={(value) => setPrintSettings({ ...printSettings, paperSize: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm</SelectItem>
                  <SelectItem value="80mm">80mm</SelectItem>
                  <SelectItem value="A4">A4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>列印 Logo</Label>
                <p className="text-sm text-gray-500">在收據上列印店家 Logo</p>
              </div>
              <Switch
                checked={printSettings.printLogo}
                onCheckedChange={(checked) => setPrintSettings({ ...printSettings, printLogo: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>列印 QR Code</Label>
                <p className="text-sm text-gray-500">在收據上列印發票 QR Code</p>
              </div>
              <Switch
                checked={printSettings.printQRCode}
                onCheckedChange={(checked) => setPrintSettings({ ...printSettings, printQRCode: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>列印頁尾</Label>
                <p className="text-sm text-gray-500">在收據底部列印自訂文字</p>
              </div>
              <Switch
                checked={printSettings.printFooter}
                onCheckedChange={(checked) => setPrintSettings({ ...printSettings, printFooter: checked })}
              />
            </div>
            {printSettings.printFooter && (
              <div className="space-y-2 pl-4">
                <Label>頁尾文字</Label>
                <Input
                  value={printSettings.footerText}
                  onChange={(e) => setPrintSettings({ ...printSettings, footerText: e.target.value })}
                  placeholder="輸入頁尾文字"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 通知設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>通知設定</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleReset('通知設定')}>
                <RefreshCw className="mr-2 h-4 w-4" />
                重置
              </Button>
              <Button size="sm" onClick={() => handleSave('通知設定')}>
                <Save className="mr-2 h-4 w-4" />
                儲存
              </Button>
            </div>
          </div>
          <CardDescription>設定系統通知相關選項</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>庫存不足提醒</Label>
                <p className="text-sm text-gray-500">當商品庫存低於設定值時提醒</p>
              </div>
              <Switch
                checked={notificationSettings.lowStockAlert}
                onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, lowStockAlert: checked })}
              />
            </div>
            {notificationSettings.lowStockAlert && (
              <div className="space-y-2 pl-4">
                <Label>庫存警示閾值</Label>
                <Input
                  type="number"
                  value={notificationSettings.lowStockThreshold}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, lowStockThreshold: parseInt(e.target.value) || 10 })}
                  min="1"
                  className="w-32"
                />
                <p className="text-sm text-gray-500">當庫存低於此數量時會發出提醒</p>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>銷售提醒</Label>
                <p className="text-sm text-gray-500">顯示銷售相關通知</p>
              </div>
              <Switch
                checked={notificationSettings.salesAlert}
                onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, salesAlert: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>錯誤提醒</Label>
                <p className="text-sm text-gray-500">顯示系統錯誤通知</p>
              </div>
              <Switch
                checked={notificationSettings.errorAlert}
                onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, errorAlert: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>啟用聲音</Label>
                <p className="text-sm text-gray-500">通知時播放提示音</p>
              </div>
              <Switch
                checked={notificationSettings.soundEnabled}
                onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, soundEnabled: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 資料庫管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>資料庫管理</CardTitle>
            </div>
          </div>
          <CardDescription>管理 POS 系統的本地資料庫</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">重置商品資料</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  此操作將清空所有現有商品資料，並重新載入 240 個預設商品（12 個分類，每個分類 20 項）。
                  此操作無法復原，請謹慎使用。
                </p>
              </div>
            </AlertDescription>
          </Alert>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">重置商品資料</Label>
              <p className="text-sm text-gray-500">
                清空所有商品並重新初始化為預設商品
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleResetProducts}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              重置商品
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 儲存所有設定 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => handleReset('所有設定')}>
          <RefreshCw className="mr-2 h-4 w-4" />
          重置所有設定
        </Button>
        <Button onClick={() => handleSave('所有設定')}>
          <Save className="mr-2 h-4 w-4" />
          儲存所有設定
        </Button>
      </div>
    </div>
  );
}

