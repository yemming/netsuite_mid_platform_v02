'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save, Plus } from 'lucide-react';

export default function MoldBasicDataPage() {
  const [formData, setFormData] = useState({
    moldCode: '',
    moldName: '',
    specification: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">模具基本資料維護</h1>
        </div>
        <p className="text-muted-foreground">
          維護模具代號、名稱、規格等基本資料
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>模具基本資料</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="moldCode">模具代號</Label>
              <Input
                id="moldCode"
                value={formData.moldCode}
                onChange={(e) => handleInputChange('moldCode', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: MOLD-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moldName">模具名稱</Label>
              <Input
                id="moldName"
                value={formData.moldName}
                onChange={(e) => handleInputChange('moldName', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: 產品A模具"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specification">規格</Label>
              <Input
                id="specification"
                value={formData.specification}
                onChange={(e) => handleInputChange('specification', e.target.value)}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: 100x50x30"
              />
            </div>
          </div>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList>
              <TabsTrigger value="basic">模具基本資料</TabsTrigger>
              <TabsTrigger value="attachments">附件</TabsTrigger>
              <TabsTrigger value="images">圖文</TabsTrigger>
              <TabsTrigger value="materials">製作用材</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="text-muted-foreground">
                基本資料維護區域
              </div>
            </TabsContent>
            <TabsContent value="attachments" className="space-y-4 mt-4">
              <div className="text-muted-foreground">
                附件管理區域
              </div>
            </TabsContent>
            <TabsContent value="images" className="space-y-4 mt-4">
              <div className="text-muted-foreground">
                圖文管理區域
              </div>
            </TabsContent>
            <TabsContent value="materials" className="space-y-4 mt-4">
              <div className="text-muted-foreground">
                製作用材管理區域
              </div>
            </TabsContent>
          </Tabs>

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

