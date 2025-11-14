'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Play, FileText } from 'lucide-react';

export default function DemandPlanningPage() {
  const [formData, setFormData] = useState({
    planningStartDate: '',
    processingMethod: 'full'
  });

  const handleSubmit = () => {
    // TODO: 實作需求規劃處理邏輯
    alert('需求規劃處理已執行');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">需求規劃處理</h1>
        </div>
        <p className="text-muted-foreground">
          執行需求規劃與排程計算
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>規劃參數設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="planningStartDate">規劃起始日期</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="planningStartDate"
                type="date"
                value={formData.planningStartDate}
                onChange={(e) => setFormData(prev => ({ ...prev, planningStartDate: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input pl-10"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>處理方式</Label>
            <RadioGroup
              value={formData.processingMethod}
              onValueChange={(value) => setFormData(prev => ({ ...prev, processingMethod: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="font-normal cursor-pointer">
                  完整規劃（重新計算所有排程）
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="incremental" id="incremental" />
                <Label htmlFor="incremental" className="font-normal cursor-pointer">
                  增量規劃（僅計算變更部分）
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="optimize" id="optimize" />
                <Label htmlFor="optimize" className="font-normal cursor-pointer">
                  最佳化規劃（優化現有排程）
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSubmit} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              執行
            </Button>
            <Button variant="outline" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              查看紀錄
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

