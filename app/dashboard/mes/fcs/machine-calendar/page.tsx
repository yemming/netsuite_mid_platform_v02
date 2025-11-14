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
import { Calendar, Search, Save } from 'lucide-react';

export default function MachineCalendarPage() {
  const [filterData, setFilterData] = useState({
    machineCode: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  const [workHours, setWorkHours] = useState({
    sunday: '8.0000',
    monday: '8.0000',
    tuesday: '8.0000',
    wednesday: '8.0000',
    thursday: '8.0000',
    friday: '8.0000',
    saturday: '8.0000'
  });

  const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
  const daysInMonth = 31; // 簡化版本，實際應根據月份計算

  const handleWorkHoursChange = (day: string, value: string) => {
    setWorkHours(prev => ({ ...prev, [day]: value }));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">機台行事曆維護</h1>
        </div>
        <p className="text-muted-foreground">
          設定機台工作時數與每日產能
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側：過濾條件與工作時數設定 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>查詢條件</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="machineCode">機台代號</Label>
                <Input
                  id="machineCode"
                  value={filterData.machineCode}
                  onChange={(e) => setFilterData(prev => ({ ...prev, machineCode: e.target.value }))}
                  className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                  placeholder="例如: F24-01"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">年份</Label>
                  <Input
                    id="year"
                    type="number"
                    value={filterData.year}
                    onChange={(e) => setFilterData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month">月份</Label>
                  <Input
                    id="month"
                    type="number"
                    min="1"
                    max="12"
                    value={filterData.month}
                    onChange={(e) => setFilterData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
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

          <Card>
            <CardHeader>
              <CardTitle>行事曆工作時數</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(workHours).map(([day, hours], index) => (
                <div key={day} className="flex items-center justify-between">
                  <Label className="w-20">星期{daysOfWeek[index]}</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={hours}
                    onChange={(e) => handleWorkHoursChange(day, e.target.value)}
                    className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input w-32"
                  />
                </div>
              ))}
              <Button className="w-full">
                <Save className="h-4 w-4 mr-2" />
                儲存設定
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 右側：月曆表格 */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filterData.year}年 {filterData.month}月 行事曆
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>工作時數</TableHead>
                    <TableHead>每日產能</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const dayOfWeek = new Date(filterData.year, filterData.month - 1, day).getDay();
                    const dayKey = Object.keys(workHours)[dayOfWeek] as keyof typeof workHours;
                    return (
                      <TableRow key={day} className="hover:bg-accent/50">
                        <TableCell className="font-medium">{day}日</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.0001"
                            defaultValue={workHours[dayKey]}
                            className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            defaultValue="100.00"
                            className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input w-24"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

