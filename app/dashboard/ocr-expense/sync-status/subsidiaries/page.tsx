'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Database, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/utils/supabase/client';

interface Subsidiary {
  id: string;
  netsuite_internal_id: number;
  name: string;
  legal_name: string | null;
  country: string | null;
  base_currency_id: number | null;
  parent_id: number | null;
  full_name: string | null;
  is_elimination: boolean;
  state: string | null;
  email: string | null;
  fiscal_calendar_id: number | null;
  is_active: boolean;
  sync_timestamp: string | null;
  created_at: string;
  updated_at: string;
}

export default function SubsidiariesPage() {
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubsidiaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('ns_subsidiaries')
        .select('*')
        .order('netsuite_internal_id', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setSubsidiaries(data || []);
    } catch (err: any) {
      console.error('載入公司別資料錯誤:', err);
      setError(err.message || '載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubsidiaries();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/ocr-expense/sync-status">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回同步狀態
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-[#28363F] dark:text-[#5a7885]" />
          <h1 className="text-3xl font-bold text-foreground">公司別資料</h1>
        </div>
        <p className="text-muted-foreground">
          查看 Supabase 中所有公司別的詳細資料
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>公司別列表</CardTitle>
              <CardDescription className="mt-1">
                共 {subsidiaries.length} 筆記錄
              </CardDescription>
            </div>
            <Button
              onClick={loadSubsidiaries}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              重新整理
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">載入中...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600 dark:text-red-400">
              <span>錯誤：{error}</span>
            </div>
          ) : subsidiaries.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <span>目前沒有資料</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">NetSuite ID</TableHead>
                    <TableHead className="w-[200px]">公司名稱</TableHead>
                    <TableHead className="w-[200px]">法定名稱</TableHead>
                    <TableHead className="w-[120px]">國家</TableHead>
                    <TableHead className="w-[100px]">幣別 ID</TableHead>
                    <TableHead className="w-[100px]">父公司 ID</TableHead>
                    <TableHead className="w-[250px]">完整階層名稱</TableHead>
                    <TableHead className="w-[100px]">狀態</TableHead>
                    <TableHead className="w-[150px]">最後同步時間</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subsidiaries.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.netsuite_internal_id}
                      </TableCell>
                      <TableCell className="font-medium">{sub.name}</TableCell>
                      <TableCell>{sub.legal_name || '-'}</TableCell>
                      <TableCell>{sub.country || '-'}</TableCell>
                      <TableCell>{sub.base_currency_id || '-'}</TableCell>
                      <TableCell>{sub.parent_id || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sub.full_name || '-'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            sub.is_active
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                          }`}
                        >
                          {sub.is_active ? '啟用' : '停用'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(sub.sync_timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

