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
import { Settings, Plus, Search, Trash2, Edit } from 'lucide-react';

export default function ResourceTypesPage() {
  const [formData, setFormData] = useState({
    typeCode: '',
    typeName: ''
  });

  const [resourceTypes] = useState([
    { id: 'RT001', typeCode: 'MACHINE', typeName: '機台', resourceCount: 24 },
    { id: 'RT002', typeCode: 'PERSON', typeName: '人員', resourceCount: 45 },
    { id: 'RT003', typeCode: 'TOOL', typeName: '工具', resourceCount: 12 }
  ]);

  const [resources] = useState([
    { id: 'R001', resourceCode: 'F24-01', resourceName: 'F24-01 機台', typeCode: 'MACHINE' },
    { id: 'R002', resourceCode: 'F24-02', resourceName: 'F24-02 機台', typeCode: 'MACHINE' },
    { id: 'R003', resourceCode: 'P001', resourceName: '張三', typeCode: 'PERSON' }
  ]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">資源型態維護</h1>
        </div>
        <p className="text-muted-foreground">
          維護資源型態代號與名稱，並管理各型態下的資源
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側：型態維護表單 */}
        <Card>
          <CardHeader>
            <CardTitle>資源型態資料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="typeCode">型態代號</Label>
              <Input
                id="typeCode"
                value={formData.typeCode}
                onChange={(e) => handleInputChange('typeCode', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: MACHINE"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="typeName">型態名稱</Label>
              <Input
                id="typeName"
                value={formData.typeName}
                onChange={(e) => handleInputChange('typeName', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: 機台"
              />
            </div>
            <div className="flex gap-2">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新增
              </Button>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                修改
              </Button>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                刪除
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 右側：型態列表 */}
        <Card>
          <CardHeader>
            <CardTitle>資源型態清單</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>型態代號</TableHead>
                    <TableHead>型態名稱</TableHead>
                    <TableHead>資源數量</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resourceTypes.map((type) => (
                    <TableRow key={type.id} className="hover:bg-accent/50">
                      <TableCell className="font-medium">{type.typeCode}</TableCell>
                      <TableCell>{type.typeName}</TableCell>
                      <TableCell>{type.resourceCount}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 下方：資源資料表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>資源資料</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋資源..."
                  className="pl-10 w-64"
                />
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新增資源
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>資源代號</TableHead>
                  <TableHead>資源名稱</TableHead>
                  <TableHead>型態代號</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">{resource.resourceCode}</TableCell>
                    <TableCell>{resource.resourceName}</TableCell>
                    <TableCell>{resource.typeCode}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
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

