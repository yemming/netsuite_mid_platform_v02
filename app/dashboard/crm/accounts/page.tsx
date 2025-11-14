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
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Globe,
  Edit,
  Eye,
  Users,
} from 'lucide-react';
import { Account } from '@/lib/types/crm';

// 模擬資料
const mockAccounts: Account[] = [
  {
    id: 'acc-1',
    name: 'ABC 科技股份有限公司',
    industry: '科技業',
    website: 'https://www.abc-tech.com',
    phone: '02-1234-5678',
    email: 'contact@abc-tech.com',
    address: {
      street: '台北市信義區信義路五段7號',
      city: '台北市',
      state: '台北市',
      country: '台灣',
      zipCode: '110',
    },
    annualRevenue: 500000000,
    employeeCount: 500,
    description: '專注於企業軟體解決方案的科技公司',
    ownerName: '業務經理 李四',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-20',
    tags: ['VIP客戶', '科技業'],
  },
  {
    id: 'acc-2',
    name: 'XYZ 企業有限公司',
    industry: '製造業',
    website: 'https://www.xyz-corp.com',
    phone: '03-2345-6789',
    email: 'info@xyz-corp.com',
    address: {
      street: '新竹市東區光復路二段101號',
      city: '新竹市',
      state: '新竹市',
      country: '台灣',
      zipCode: '300',
    },
    annualRevenue: 300000000,
    employeeCount: 300,
    description: '專業製造業公司',
    ownerName: '業務專員 陳六',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-25',
    tags: ['製造業'],
  },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const filteredAccounts = accounts.filter(acc =>
    acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">客戶管理</h1>
          <p className="text-gray-500 mt-1">管理所有客戶資訊</p>
        </div>
        <Button onClick={() => {
          setSelectedAccount(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          新增客戶
        </Button>
      </div>

      {/* 搜尋 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜尋客戶名稱或產業..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 客戶列表 */}
      <Card>
        <CardHeader>
          <CardTitle>客戶列表</CardTitle>
          <CardDescription>共 {filteredAccounts.length} 個客戶</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客戶名稱</TableHead>
                <TableHead>產業</TableHead>
                <TableHead>聯絡資訊</TableHead>
                <TableHead>年營收</TableHead>
                <TableHead>負責人</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="font-medium">{account.name}</div>
                    {account.tags && account.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {account.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{account.industry || '-'}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {account.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {account.phone}
                        </div>
                      )}
                      {account.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {account.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {account.annualRevenue
                      ? `$${account.annualRevenue.toLocaleString()}`
                      : '-'}
                  </TableCell>
                  <TableCell>{account.ownerName || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAccount(account);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增/編輯客戶對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAccount ? '編輯客戶' : '新增客戶'}</DialogTitle>
            <DialogDescription>
              {selectedAccount ? '修改客戶資訊' : '建立新的客戶記錄'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>客戶名稱 *</Label>
                <Input placeholder="例如: ABC 科技股份有限公司" defaultValue={selectedAccount?.name} />
              </div>
              <div>
                <Label>產業</Label>
                <Input placeholder="例如: 科技業" defaultValue={selectedAccount?.industry} />
              </div>
              <div>
                <Label>電話</Label>
                <Input placeholder="02-1234-5678" defaultValue={selectedAccount?.phone} />
              </div>
              <div>
                <Label>郵箱</Label>
                <Input type="email" placeholder="contact@example.com" defaultValue={selectedAccount?.email} />
              </div>
              <div>
                <Label>網站</Label>
                <Input placeholder="https://www.example.com" defaultValue={selectedAccount?.website} />
              </div>
              <div>
                <Label>年營收</Label>
                <Input type="number" placeholder="0" defaultValue={selectedAccount?.annualRevenue} />
              </div>
              <div>
                <Label>員工人數</Label>
                <Input type="number" placeholder="0" defaultValue={selectedAccount?.employeeCount} />
              </div>
            </div>
            <div>
              <Label>地址</Label>
              <Input placeholder="完整地址" defaultValue={selectedAccount?.address?.street} />
            </div>
            <div>
              <Label>描述</Label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="輸入客戶描述..."
                defaultValue={selectedAccount?.description}
              />
            </div>
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

