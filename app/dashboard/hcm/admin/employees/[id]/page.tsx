'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save } from 'lucide-react';

/**
 * 員工詳細資料頁面
 * 顯示和編輯單一員工的完整資訊
 */
export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [formData, setFormData] = useState({
    employeeId: 'EMP001',
    name: '張三',
    department: '研發部',
    position: '資深工程師',
    status: '在職',
    email: 'zhang.san@company.com',
    phone: '0912-345-678',
    joinDate: '2023-01-15',
    idNumber: 'A123456789',
    address: '台北市信義區信義路五段7號',
  });

  const handleSave = async () => {
    // TODO: 實作儲存邏輯
    console.log('儲存員工資料:', formData);
  };

  return (
    <div className="space-y-6 p-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            員工資料 - {formData.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            工號: {formData.employeeId}
          </p>
        </div>
        <div className="ml-auto">
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            儲存變更
          </Button>
        </div>
      </div>

      {/* 員工資料表單 */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">基本資料</TabsTrigger>
          <TabsTrigger value="employment">任職資訊</TabsTrigger>
          <TabsTrigger value="contact">聯絡資訊</TabsTrigger>
          <TabsTrigger value="documents">文件管理</TabsTrigger>
        </TabsList>

        {/* 基本資料 */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>基本資料</CardTitle>
              <CardDescription>員工的基本個人資訊</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">工號</Label>
                  <Input id="employeeId" value={formData.employeeId} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">姓名 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idNumber">身分證字號</Label>
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joinDate">到職日</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 任職資訊 */}
        <TabsContent value="employment">
          <Card>
            <CardHeader>
              <CardTitle>任職資訊</CardTitle>
              <CardDescription>員工的組織架構和職位資訊</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">部門</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="研發部">研發部</SelectItem>
                      <SelectItem value="業務部">業務部</SelectItem>
                      <SelectItem value="人事部">人事部</SelectItem>
                      <SelectItem value="財務部">財務部</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">職位</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">狀態</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="在職">在職</SelectItem>
                      <SelectItem value="離職">離職</SelectItem>
                      <SelectItem value="留停">留停</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 聯絡資訊 */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>聯絡資訊</CardTitle>
              <CardDescription>員工的聯絡方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">電子郵件</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">電話</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">地址</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 文件管理 */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>文件管理</CardTitle>
              <CardDescription>員工相關文件的上傳和管理</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>文件管理功能開發中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

