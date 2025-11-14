'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Settings, Plus, Search, Edit, Trash2 } from 'lucide-react';

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const [resources] = useState([
    { id: 'R001', code: 'F24-01', name: 'F24-01 機台', type: 'MACHINE', status: '運行中', location: '第03區' },
    { id: 'R002', code: 'F24-02', name: 'F24-02 機台', type: 'MACHINE', status: '運行中', location: '第03區' },
    { id: 'R003', code: 'DS-01', name: 'DS-01 機台', type: 'MACHINE', status: '維修中', location: '第01區' },
    { id: 'R004', code: 'F10-01', name: 'F10-01 機台', type: 'MACHINE', status: '停機', location: '第02區' },
    { id: 'R005', code: 'P001', name: '張三', type: 'PERSON', status: '在職', location: '第03區' },
    { id: 'R006', code: 'P002', name: '李四', type: 'PERSON', status: '在職', location: '第01區' }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case '運行中':
        return 'text-green-600 dark:text-green-500';
      case '維修中':
        return 'text-yellow-600 dark:text-yellow-500';
      case '停機':
        return 'text-red-600 dark:text-red-500';
      case '在職':
        return 'text-blue-600 dark:text-blue-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const filteredResources = resources.filter(resource =>
    resource.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">資源資料維護</h1>
        </div>
        <p className="text-muted-foreground">
          維護機台、人員等資源基本資料
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>資源清單</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋資源代號或名稱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  <TableHead>型態</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.map((resource) => (
                  <TableRow key={resource.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">{resource.code}</TableCell>
                    <TableCell>{resource.name}</TableCell>
                    <TableCell>{resource.type}</TableCell>
                    <TableCell>
                      <span className={getStatusColor(resource.status)}>
                        {resource.status}
                      </span>
                    </TableCell>
                    <TableCell>{resource.location}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

