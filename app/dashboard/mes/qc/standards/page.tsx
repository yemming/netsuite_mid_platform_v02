'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Settings, Plus, Save } from 'lucide-react';

export default function QCStandardsPage() {
  const [formData, setFormData] = useState({
    itemCode: '',
    itemName: ''
  });

  const [inspectionItems] = useState([
    { id: 'ITEM001', sequence: 1, inspectionItem: '尺寸', standardValue: '100.00', minValue: '99.50', maxValue: '100.50' },
    { id: 'ITEM002', sequence: 2, inspectionItem: '重量', standardValue: '50.00', minValue: '49.50', maxValue: '50.50' },
    { id: 'ITEM003', sequence: 3, inspectionItem: '硬度', standardValue: 'HRC 45', minValue: 'HRC 44', maxValue: 'HRC 46' }
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">料品檢驗標準資料建立</h1>
        </div>
        <p className="text-muted-foreground">
          建立料品檢驗標準與檢驗項目
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側：料品基本資料 */}
        <Card>
          <CardHeader>
            <CardTitle>料品基本資料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemCode">料品代號</Label>
              <Input
                id="itemCode"
                value={formData.itemCode}
                onChange={(e) => setFormData(prev => ({ ...prev, itemCode: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: ITEM-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemName">料品名稱</Label>
              <Input
                id="itemName"
                value={formData.itemName}
                onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: 產品A"
              />
            </div>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              儲存
            </Button>
          </CardContent>
        </Card>

        {/* 右側：檢驗項目 */}
        <Card>
          <CardHeader>
            <CardTitle>檢驗項目</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="finished" className="w-full">
              <TabsList>
                <TabsTrigger value="finished">成品檢驗</TabsTrigger>
                <TabsTrigger value="process">製程檢驗</TabsTrigger>
                <TabsTrigger value="receiving">接收檢驗</TabsTrigger>
              </TabsList>
              <TabsContent value="finished" className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>序號</TableHead>
                        <TableHead>檢驗項目</TableHead>
                        <TableHead>標準值</TableHead>
                        <TableHead>最小值</TableHead>
                        <TableHead>最大值</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inspectionItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-accent/50">
                          <TableCell>{item.sequence}</TableCell>
                          <TableCell className="font-medium">{item.inspectionItem}</TableCell>
                          <TableCell>{item.standardValue}</TableCell>
                          <TableCell>{item.minValue}</TableCell>
                          <TableCell>{item.maxValue}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  新增檢驗項目
                </Button>
              </TabsContent>
              <TabsContent value="process" className="mt-4">
                <div className="text-muted-foreground">製程檢驗項目</div>
              </TabsContent>
              <TabsContent value="receiving" className="mt-4">
                <div className="text-muted-foreground">接收檢驗項目</div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

