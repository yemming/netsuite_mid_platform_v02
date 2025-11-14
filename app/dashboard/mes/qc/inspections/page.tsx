'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileCheck, Search, Save, Plus } from 'lucide-react';

export default function QCInspectionsPage() {
  const [formData, setFormData] = useState({
    documentNumber: '',
    itemCode: '',
    overallJudgment: 'qualified',
    qualityManager: ''
  });

  const [inspectionItems] = useState([
    { id: 'ITEM001', inspectionItem: '尺寸', standardValue: '100.00', testValue: '100.02', judgment: '合格' },
    { id: 'ITEM002', inspectionItem: '重量', standardValue: '50.00', testValue: '50.05', judgment: '合格' },
    { id: 'ITEM003', inspectionItem: '硬度', standardValue: 'HRC 45', testValue: 'HRC 45', judgment: '合格' }
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">各類檢驗資料維護/審核</h1>
        </div>
        <p className="text-muted-foreground">
          維護與審核各類檢驗資料
        </p>
      </div>

      {/* 檢驗單基本資料 */}
      <Card>
        <CardHeader>
          <CardTitle>檢驗單基本資料</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="documentNumber">單號</Label>
              <Input
                id="documentNumber"
                value={formData.documentNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: QC-2025-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemCode">料號</Label>
              <Input
                id="itemCode"
                value={formData.itemCode}
                onChange={(e) => setFormData(prev => ({ ...prev, itemCode: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: ITEM-001"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 檢驗項目明細 */}
      <Card>
        <CardHeader>
          <CardTitle>檢驗項目明細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>檢驗項目</TableHead>
                  <TableHead>標準值</TableHead>
                  <TableHead>實測值</TableHead>
                  <TableHead>判定</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspectionItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">{item.inspectionItem}</TableCell>
                    <TableCell>{item.standardValue}</TableCell>
                    <TableCell>
                      <Input
                        value={item.testValue}
                        className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <span className={item.judgment === '合格' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                        {item.judgment}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>總判定</Label>
              <RadioGroup
                value={formData.overallJudgment}
                onValueChange={(value) => setFormData(prev => ({ ...prev, overallJudgment: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="qualified" id="qualified" />
                  <Label htmlFor="qualified" className="font-normal cursor-pointer text-green-600 dark:text-green-500">
                    合格
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unqualified" id="unqualified" />
                  <Label htmlFor="unqualified" className="font-normal cursor-pointer text-red-600 dark:text-red-500">
                    不合格
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualityManager">品保主管</Label>
              <Input
                id="qualityManager"
                value={formData.qualityManager}
                onChange={(e) => setFormData(prev => ({ ...prev, qualityManager: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="簽核人員"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button>
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

