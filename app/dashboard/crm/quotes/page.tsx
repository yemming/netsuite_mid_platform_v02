'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  FileText,
  Eye,
  Edit,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Quote } from '@/lib/types/crm';

// 模擬資料
const mockQuotes: Quote[] = [
  {
    id: 'quote-1',
    quoteNumber: 'QT-2024-001',
    opportunityId: '1',
    opportunityName: 'ABC 公司 ERP 系統導入',
    accountId: 'acc-1',
    accountName: 'ABC 科技股份有限公司',
    contactId: 'con-1',
    contactName: '張三',
    status: 'sent',
    validUntil: '2024-02-29',
    subtotal: 4500000,
    tax: 225000,
    total: 4725000,
    currency: 'TWD',
    terms: 'Net 30',
    notes: '報價有效期至 2024-02-29',
    items: [
      {
        id: 'item-1',
        productName: 'ERP 系統授權',
        description: '企業版授權（500用戶）',
        quantity: 1,
        unitPrice: 3000000,
        discount: 0,
        total: 3000000,
      },
      {
        id: 'item-2',
        productName: '實施服務',
        description: '系統實施與培訓',
        quantity: 1,
        unitPrice: 1500000,
        discount: 0,
        total: 1500000,
      },
    ],
    ownerName: '業務經理 李四',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20',
  },
];

const statusConfig = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800', icon: FileText },
  sent: { label: '已發送', color: 'bg-blue-100 text-blue-800', icon: Send },
  accepted: { label: '已接受', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  rejected: { label: '已拒絕', color: 'bg-red-100 text-red-800', icon: XCircle },
  expired: { label: '已過期', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const filteredQuotes = quotes.filter(quote =>
    quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quote.accountName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quote.opportunityName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">報價單管理</h1>
          <p className="text-gray-500 mt-1">管理所有報價單</p>
        </div>
        <Button onClick={() => {
          setSelectedQuote(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          新增報價單
        </Button>
      </div>

      {/* 搜尋 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜尋報價單號、客戶名稱或商機名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 報價單列表 */}
      <Card>
        <CardHeader>
          <CardTitle>報價單列表</CardTitle>
          <CardDescription>共 {filteredQuotes.length} 張報價單</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>報價單號</TableHead>
                <TableHead>客戶</TableHead>
                <TableHead>關聯商機</TableHead>
                <TableHead>總金額</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>有效期限</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => {
                const status = statusConfig[quote.status];
                const StatusIcon = status.icon;
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                    <TableCell>{quote.accountName}</TableCell>
                    <TableCell>{quote.opportunityName || '-'}</TableCell>
                    <TableCell className="font-semibold">
                      ${quote.total.toLocaleString()} {quote.currency}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {quote.validUntil
                        ? new Date(quote.validUntil).toLocaleDateString('zh-TW')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedQuote(quote);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增/編輯報價單對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedQuote ? '編輯報價單' : '新增報價單'}</DialogTitle>
            <DialogDescription>
              {selectedQuote ? '修改報價單資訊' : '建立新的報價單'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>關聯商機 *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇商機" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">ABC 公司 ERP 系統導入</SelectItem>
                    <SelectItem value="2">XYZ 企業 CRM 升級專案</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>有效期限</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>付款條件</Label>
                <Input placeholder="例如: Net 30" defaultValue={selectedQuote?.terms} />
              </div>
              <div>
                <Label>幣別</Label>
                <Select defaultValue={selectedQuote?.currency || 'TWD'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TWD">TWD</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>備註</Label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="輸入備註..."
                defaultValue={selectedQuote?.notes}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>報價項目</Label>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  新增項目
                </Button>
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>產品名稱</TableHead>
                      <TableHead>數量</TableHead>
                      <TableHead>單價</TableHead>
                      <TableHead>折扣</TableHead>
                      <TableHead>小計</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuote?.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.unitPrice.toLocaleString()}</TableCell>
                        <TableCell>{item.discount || 0}%</TableCell>
                        <TableCell className="font-semibold">${item.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            {selectedQuote && (
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <div className="text-right">
                  <div className="text-sm text-gray-500">小計: ${selectedQuote.subtotal.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">稅額: ${selectedQuote.tax.toLocaleString()}</div>
                  <div className="text-lg font-bold">總計: ${selectedQuote.total.toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

