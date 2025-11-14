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
import { Badge } from '@/components/ui/badge';
import { Receipt, Search, FileText, DollarSign, Calendar, CheckCircle2, Clock } from 'lucide-react';

export default function AccountingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');

  const [invoices] = useState([
    {
      id: 'INV001',
      invoiceNumber: 'INV-2025-001',
      poNumber: 'PO-2025-001',
      invoiceDate: '2025-02-15',
      dueDate: '2025-03-15',
      amount: 125000,
      paidAmount: 0,
      status: 'pending',
      paymentDate: null
    },
    {
      id: 'INV002',
      invoiceNumber: 'INV-2025-002',
      poNumber: 'PO-2025-002',
      invoiceDate: '2025-02-10',
      dueDate: '2025-03-10',
      amount: 100000,
      paidAmount: 100000,
      status: 'paid',
      paymentDate: '2025-02-28'
    },
    {
      id: 'INV003',
      invoiceNumber: 'INV-2025-003',
      poNumber: 'PO-2025-003',
      invoiceDate: '2025-01-20',
      dueDate: '2025-02-20',
      amount: 120000,
      paidAmount: 0,
      status: 'overdue',
      paymentDate: null
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">待付款</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">已付款</Badge>;
      case 'overdue':
        return <Badge variant="destructive">逾期</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.poNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPending = invoices
    .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);

  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.paidAmount, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Receipt className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">帳務作業</h1>
        </div>
        <p className="text-muted-foreground">
          發票與帳款管理，追蹤付款狀態
        </p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待付款總額</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              NT$ {totalPending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').length} 筆待處理
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已付款總額</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              NT$ {totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.filter(inv => inv.status === 'paid').length} 筆已付款
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">逾期帳款</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              NT$ {invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.filter(inv => inv.status === 'overdue').length} 筆逾期
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 發票清單 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>發票清單</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋發票號或採購單號..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  全部
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                >
                  待付款
                </Button>
                <Button
                  variant={statusFilter === 'paid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('paid')}
                >
                  已付款
                </Button>
                <Button
                  variant={statusFilter === 'overdue' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('overdue')}
                >
                  逾期
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>發票號碼</TableHead>
                  <TableHead>採購單號</TableHead>
                  <TableHead>發票日期</TableHead>
                  <TableHead>到期日</TableHead>
                  <TableHead>發票金額</TableHead>
                  <TableHead>已付金額</TableHead>
                  <TableHead>未付金額</TableHead>
                  <TableHead>付款日期</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.poNumber}</TableCell>
                    <TableCell>{invoice.invoiceDate}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell>NT$ {invoice.amount.toLocaleString()}</TableCell>
                    <TableCell>NT$ {invoice.paidAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      NT$ {(invoice.amount - invoice.paidAmount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {invoice.paymentDate || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          查看
                        </Button>
                        {invoice.status === 'pending' && (
                          <Button size="sm">
                            <DollarSign className="h-4 w-4 mr-2" />
                            記錄付款
                          </Button>
                        )}
                      </div>
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

