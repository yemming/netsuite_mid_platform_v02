'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  Printer, 
  Wifi, 
  QrCode,
  Download,
  Upload,
  Settings
} from 'lucide-react';

/**
 * WMS 後台設定
 * 6.2 畫面: WMS 後台設定 (Page 75)
 * 
 * UI 要求：
 * - Web 介面 (Next.js)
 * - 功能：
 *   - 廠區&儲位條碼設計：定義倉儲佈局 (e.g., A-01-01) 並產生條碼
 *   - 採購收料標籤設計：設計收料時要列印的物料標籤
 *   - 成品標籤設計：設計完工入庫時要列印的成品標籤
 *   - 廠區 AP 布置&測試：(Page 76) 顯示 WiFi 訊號地圖
 */
export default function WMSSettingsPage() {
  const [storageLayout, setStorageLayout] = useState({
    zone: 'A',
    row: '01',
    shelf: '01'
  });

  const [labelDesign, setLabelDesign] = useState({
    materialLabel: {
      showItemCode: true,
      showItemName: true,
      showQuantity: true,
      showDate: true
    },
    productLabel: {
      showItemCode: true,
      showItemName: true,
      showBatch: true,
      showDate: true
    }
  });

  // 產生儲位條碼
  const generateStorageBarcode = () => {
    const barcode = `${storageLayout.zone}-${storageLayout.row}-${storageLayout.shelf}`;
    return barcode;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">WMS 後台設定</h1>
        </div>
        <p className="text-muted-foreground">
          倉儲佈局、標籤設計與 WiFi 訊號管理
        </p>
      </div>

      <Tabs defaultValue="storage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="storage">廠區&儲位條碼</TabsTrigger>
          <TabsTrigger value="material-label">收料標籤</TabsTrigger>
          <TabsTrigger value="product-label">成品標籤</TabsTrigger>
          <TabsTrigger value="wifi-map">WiFi 訊號地圖</TabsTrigger>
        </TabsList>

        {/* 廠區&儲位條碼設計 */}
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                廠區&儲位條碼設計
              </CardTitle>
              <CardDescription>
                定義倉儲佈局並產生條碼 (格式: A-01-01)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zone">廠區代號</Label>
                  <Input
                    id="zone"
                    value={storageLayout.zone}
                    onChange={(e) => setStorageLayout({ ...storageLayout, zone: e.target.value.toUpperCase() })}
                    placeholder="A"
                    maxLength={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="row">排號</Label>
                  <Input
                    id="row"
                    value={storageLayout.row}
                    onChange={(e) => setStorageLayout({ ...storageLayout, row: e.target.value.padStart(2, '0') })}
                    placeholder="01"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shelf">架號</Label>
                  <Input
                    id="shelf"
                    value={storageLayout.shelf}
                    onChange={(e) => setStorageLayout({ ...storageLayout, shelf: e.target.value.padStart(2, '0') })}
                    placeholder="01"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="p-6 bg-muted rounded-lg">
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">儲位條碼</p>
                    <div className="text-3xl font-bold text-foreground font-mono">
                      {generateStorageBarcode()}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded border-2 border-dashed border-gray-300">
                      <QrCode className="h-32 w-32 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      下載條碼
                    </Button>
                    <Button variant="outline">
                      <Printer className="h-4 w-4 mr-2" />
                      列印條碼
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>批次產生條碼</Label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="起始排號" />
                  <Input type="number" placeholder="結束排號" />
                  <Input type="number" placeholder="每排架數" />
                  <Button>批次產生</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 採購收料標籤設計 */}
        <TabsContent value="material-label">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                採購收料標籤設計
              </CardTitle>
              <CardDescription>
                設計收料時要列印的物料標籤格式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-item-code"
                    checked={labelDesign.materialLabel.showItemCode}
                    onChange={(e) => setLabelDesign({
                      ...labelDesign,
                      materialLabel: { ...labelDesign.materialLabel, showItemCode: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="show-item-code">顯示料號</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-item-name"
                    checked={labelDesign.materialLabel.showItemName}
                    onChange={(e) => setLabelDesign({
                      ...labelDesign,
                      materialLabel: { ...labelDesign.materialLabel, showItemName: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="show-item-name">顯示料名</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-quantity"
                    checked={labelDesign.materialLabel.showQuantity}
                    onChange={(e) => setLabelDesign({
                      ...labelDesign,
                      materialLabel: { ...labelDesign.materialLabel, showQuantity: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="show-quantity">顯示數量</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-date"
                    checked={labelDesign.materialLabel.showDate}
                    onChange={(e) => setLabelDesign({
                      ...labelDesign,
                      materialLabel: { ...labelDesign.materialLabel, showDate: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="show-date">顯示日期</Label>
                </div>
              </div>

              <div className="p-6 bg-muted rounded-lg border-2 border-dashed">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground mb-4">標籤預覽</p>
                  <div className="bg-white p-4 rounded border inline-block">
                    {labelDesign.materialLabel.showItemCode && (
                      <div className="text-sm mb-2">料號: ITEM-001</div>
                    )}
                    {labelDesign.materialLabel.showItemName && (
                      <div className="text-sm mb-2">料名: 原物料A</div>
                    )}
                    {labelDesign.materialLabel.showQuantity && (
                      <div className="text-sm mb-2">數量: 100</div>
                    )}
                    {labelDesign.materialLabel.showDate && (
                      <div className="text-sm">日期: 2024-01-15</div>
                    )}
                    <div className="mt-4">
                      <QrCode className="h-16 w-16 mx-auto text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  儲存設計
                </Button>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  測試列印
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 成品標籤設計 */}
        <TabsContent value="product-label">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                成品標籤設計
              </CardTitle>
              <CardDescription>
                設計完工入庫時要列印的成品標籤格式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-product-code"
                    checked={labelDesign.productLabel.showItemCode}
                    onChange={(e) => setLabelDesign({
                      ...labelDesign,
                      productLabel: { ...labelDesign.productLabel, showItemCode: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="show-product-code">顯示成品號</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-product-name"
                    checked={labelDesign.productLabel.showItemName}
                    onChange={(e) => setLabelDesign({
                      ...labelDesign,
                      productLabel: { ...labelDesign.productLabel, showItemName: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="show-product-name">顯示成品名</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-batch"
                    checked={labelDesign.productLabel.showBatch}
                    onChange={(e) => setLabelDesign({
                      ...labelDesign,
                      productLabel: { ...labelDesign.productLabel, showBatch: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="show-batch">顯示批號</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-product-date"
                    checked={labelDesign.productLabel.showDate}
                    onChange={(e) => setLabelDesign({
                      ...labelDesign,
                      productLabel: { ...labelDesign.productLabel, showDate: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="show-product-date">顯示日期</Label>
                </div>
              </div>

              <div className="p-6 bg-muted rounded-lg border-2 border-dashed">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground mb-4">標籤預覽</p>
                  <div className="bg-white p-4 rounded border inline-block">
                    {labelDesign.productLabel.showItemCode && (
                      <div className="text-sm mb-2">成品號: PROD-001</div>
                    )}
                    {labelDesign.productLabel.showItemName && (
                      <div className="text-sm mb-2">成品名: 產品A</div>
                    )}
                    {labelDesign.productLabel.showBatch && (
                      <div className="text-sm mb-2">批號: BATCH-2024-001</div>
                    )}
                    {labelDesign.productLabel.showDate && (
                      <div className="text-sm">日期: 2024-01-15</div>
                    )}
                    <div className="mt-4">
                      <QrCode className="h-16 w-16 mx-auto text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  儲存設計
                </Button>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  測試列印
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 廠區 AP 布置&測試 */}
        <TabsContent value="wifi-map">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                廠區 AP 布置&測試
              </CardTitle>
              <CardDescription>
                顯示 WiFi 訊號地圖與 AP 佈置狀況
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-muted rounded-lg border-2 border-dashed min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Wifi className="h-16 w-16 mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-foreground mb-2">WiFi 訊號地圖</p>
                    <p className="text-sm text-muted-foreground">
                      此功能將顯示廠區 WiFi AP 佈置位置與訊號強度
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      (需要整合地圖服務或平面圖)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">AP 總數</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">正常運作</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">11</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">訊號覆蓋率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">95%</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

