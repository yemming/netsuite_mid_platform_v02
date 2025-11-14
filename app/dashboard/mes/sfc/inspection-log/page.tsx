'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckSquare, Search, Plus, Save } from 'lucide-react';

export default function InspectionLogPage() {
  const [formData, setFormData] = useState({
    inspectionDate: '',
    workOrderBarcode: '',
    inspectionContent: ''
  });

  const [inspectionItems] = useState([
    { id: 'ITEM001', item: '尺寸', standardValue: '100.00', testValue1: '100.02', testValue2: '99.98', testValue3: '100.01' },
    { id: 'ITEM002', item: '重量', standardValue: '50.00', testValue1: '50.05', testValue2: '49.95', testValue3: '50.02' },
    { id: 'ITEM003', item: '硬度', standardValue: 'HRC 45', testValue1: 'HRC 45', testValue2: 'HRC 44', testValue3: 'HRC 46' }
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CheckSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">現場檢驗登錄</h1>
        </div>
        <p className="text-muted-foreground">
          登錄現場品質檢驗資料
        </p>
      </div>

      {/* 查詢條件 */}
      <Card>
        <CardHeader>
          <CardTitle>檢驗資料</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="inspectionDate">檢驗日期</Label>
              <Input
                id="inspectionDate"
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => setFormData(prev => ({ ...prev, inspectionDate: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workOrderBarcode">工令條碼</Label>
              <Input
                id="workOrderBarcode"
                value={formData.workOrderBarcode}
                onChange={(e) => setFormData(prev => ({ ...prev, workOrderBarcode: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="掃描或輸入工令條碼"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspectionContent">檢驗內容</Label>
              <Input
                id="inspectionContent"
                value={formData.inspectionContent}
                onChange={(e) => setFormData(prev => ({ ...prev, inspectionContent: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
              />
            </div>
          </div>
          <Button>
            <Search className="h-4 w-4 mr-2" />
            查詢
          </Button>
        </CardContent>
      </Card>

      {/* 檢驗項目表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>檢驗項目</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                新增項目
              </Button>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                儲存
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>序號</TableHead>
                  <TableHead>檢驗項目</TableHead>
                  <TableHead>標準值</TableHead>
                  <TableHead>檢驗值1</TableHead>
                  <TableHead>檢驗值2</TableHead>
                  <TableHead>檢驗值3</TableHead>
                  <TableHead>檢驗值4</TableHead>
                  <TableHead>檢驗值5</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspectionItems.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-accent/50">
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.item}</TableCell>
                    <TableCell>{item.standardValue}</TableCell>
                    <TableCell>
                      <Input
                        value={item.testValue1}
                        className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.testValue2}
                        className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.testValue3}
                        className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input w-24"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

