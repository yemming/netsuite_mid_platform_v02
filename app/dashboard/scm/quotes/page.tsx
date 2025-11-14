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
import { MessageSquare, Search, Plus, FileText, Eye, Send } from 'lucide-react';

export default function QuotesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'quoted' | 'accepted' | 'rejected'>('all');

  const [quotes] = useState([
    {
      id: 'RFQ001',
      rfqNumber: 'RFQ-2025-001',
      itemName: '產品A',
      quantity: 1000,
      requestedDate: '2025-02-10',
      dueDate: '2025-02-15',
      status: 'pending',
      quoteAmount: null
    },
    {
      id: 'RFQ002',
      rfqNumber: 'RFQ-2025-002',
      itemName: '產品B',
      quantity: 500,
      requestedDate: '2025-02-08',
      dueDate: '2025-02-12',
      status: 'quoted',
      quoteAmount: 125000
    },
    {
      id: 'RFQ003',
      rfqNumber: 'RFQ-2025-003',
      itemName: '產品C',
      quantity: 800,
      requestedDate: '2025-02-05',
      dueDate: '2025-02-10',
      status: 'accepted',
      quoteAmount: 96000
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">待報價</Badge>;
      case 'quoted':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">已報價</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">已接受</Badge>;
      case 'rejected':
        return <Badge variant="destructive">已拒絕</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.rfqNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">詢報價作業</h1>
        </div>
        <p className="text-muted-foreground">
          管理詢價單與報價單，回覆客戶詢價需求
        </p>
      </div>

      {/* 搜尋與篩選 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>詢價單清單</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增報價
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋詢價單號或料品名稱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
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
                待報價
              </Button>
              <Button
                variant={statusFilter === 'quoted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('quoted')}
              >
                已報價
              </Button>
            </div>
          </div>

          {/* 詢價單表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>詢價單號</TableHead>
                  <TableHead>料品名稱</TableHead>
                  <TableHead>數量</TableHead>
                  <TableHead>詢價日期</TableHead>
                  <TableHead>報價截止日</TableHead>
                  <TableHead>報價金額</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">{quote.rfqNumber}</TableCell>
                    <TableCell>{quote.itemName}</TableCell>
                    <TableCell>{quote.quantity.toLocaleString()}</TableCell>
                    <TableCell>{quote.requestedDate}</TableCell>
                    <TableCell>{quote.dueDate}</TableCell>
                    <TableCell>
                      {quote.quoteAmount ? `NT$ ${quote.quoteAmount.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          查看
                        </Button>
                        {quote.status === 'pending' && (
                          <Button size="sm">
                            <Send className="h-4 w-4 mr-2" />
                            報價
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

