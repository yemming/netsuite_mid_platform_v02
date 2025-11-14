'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';

/**
 * 薪資單頁面
 * 員工查看和下載薪資單
 */
export default function ESSPayslipPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');

  // TODO: 從 Supabase 獲取薪資單資料
  const payslip = {
    period: '2024-01',
    employeeName: '張三',
    employeeId: 'EMP001',
    department: '研發部',
    position: '資深工程師',
    items: [
      { name: '基本薪資', amount: 50000, type: 'income' },
      { name: '績效獎金', amount: 5000, type: 'income' },
      { name: '勞保費', amount: -1000, type: 'deduction' },
      { name: '健保費', amount: -800, type: 'deduction' },
      { name: '所得稅', amount: -2000, type: 'deduction' },
    ],
    totalIncome: 55000,
    totalDeduction: 3800,
    netAmount: 51200,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">薪資單</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            查看和下載您的薪資單
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-01">2024-01</SelectItem>
              <SelectItem value="2023-12">2023-12</SelectItem>
              <SelectItem value="2023-11">2023-11</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            下載 PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>薪資單明細 - {payslip.period}</CardTitle>
          <CardDescription>
            {payslip.employeeName} ({payslip.employeeId}) - {payslip.department} - {payslip.position}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>項目</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslip.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className={`text-right ${item.type === 'deduction' ? 'text-red-600' : 'text-green-600'}`}>
                        {item.amount > 0 ? '+' : ''}NT$ {Math.abs(item.amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-2 border-t pt-4">
                <div className="flex justify-between">
                  <span className="font-medium">應發總額：</span>
                  <span className="text-green-600">NT$ {payslip.totalIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">扣除總額：</span>
                  <span className="text-red-600">NT$ {payslip.totalDeduction.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>實發金額：</span>
                  <span className="text-blue-600">NT$ {payslip.netAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

