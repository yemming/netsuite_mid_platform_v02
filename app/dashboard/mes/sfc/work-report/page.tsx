'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardList, Save, Plus } from 'lucide-react';

export default function WorkReportPage() {
  const [formData, setFormData] = useState({
    workOrderBarcode: '',
    reportDate: '',
    workOrderNumber: '',
    materialCode: '',
    materialBatch: '',
    machineCode: '',
    totalWeight: '',
    bucketWeight: '',
    actualWeight: '',
    quantity: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // TODO: 實作儲存邏輯
    alert('報工資料已儲存');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">現場報工登錄</h1>
        </div>
        <p className="text-muted-foreground">
          登錄現場生產報工資料（支援多語言：中文/越南文）
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>報工資料</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workOrderBarcode">工令條碼</Label>
              <Input
                id="workOrderBarcode"
                value={formData.workOrderBarcode}
                onChange={(e) => handleInputChange('workOrderBarcode', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="掃描或輸入工令條碼"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportDate">報工日期</Label>
              <Input
                id="reportDate"
                type="date"
                value={formData.reportDate}
                onChange={(e) => handleInputChange('reportDate', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workOrderNumber">製令單號</Label>
              <Input
                id="workOrderNumber"
                value={formData.workOrderNumber}
                onChange={(e) => handleInputChange('workOrderNumber', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialCode">線材料號</Label>
              <Input
                id="materialCode"
                value={formData.materialCode}
                onChange={(e) => handleInputChange('materialCode', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialBatch">線材批號</Label>
              <Input
                id="materialBatch"
                value={formData.materialBatch}
                onChange={(e) => handleInputChange('materialBatch', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="machineCode">機台代號</Label>
              <Input
                id="machineCode"
                value={formData.machineCode}
                onChange={(e) => handleInputChange('machineCode', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalWeight">總重</Label>
              <Input
                id="totalWeight"
                type="number"
                step="0.01"
                value={formData.totalWeight}
                onChange={(e) => handleInputChange('totalWeight', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bucketWeight">桶重</Label>
              <Input
                id="bucketWeight"
                type="number"
                step="0.01"
                value={formData.bucketWeight}
                onChange={(e) => handleInputChange('bucketWeight', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualWeight">實際重量</Label>
              <Input
                id="actualWeight"
                type="number"
                step="0.01"
                value={formData.actualWeight}
                onChange={(e) => handleInputChange('actualWeight', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">數量</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              儲存
            </Button>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              新增
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

