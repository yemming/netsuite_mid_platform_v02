'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Database, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/utils/supabase/client';

// 表名到中文標籤的映射
const TABLE_LABELS: Record<string, string> = {
  'ns_currencies': '幣別',
  'ns_accounting_periods': '會計期間',
  'ns_departments': '部門',
  'ns_classes': '類別',
  'ns_locations': '地點',
  'ns_accounts': '會計科目',
  'ns_terms': '付款條件',
  'ns_tax_codes': '稅碼',
  'ns_expense_categories': '費用類別',
  'ns_items': '產品主檔',
  'ns_entities_customers': '客戶',
  'ns_entities_vendors': '供應商',
  'ns_entities_employees': '員工',
  'ns_ship_methods': '運送方式',
};

// 表名到路由的映射
const TABLE_ROUTES: Record<string, string> = {
  'ns_currencies': 'currencies',
  'ns_accounting_periods': 'accounting-periods',
  'ns_departments': 'departments',
  'ns_classes': 'classes',
  'ns_locations': 'locations',
  'ns_accounts': 'accounts',
  'ns_terms': 'terms',
  'ns_tax_codes': 'tax-codes',
  'ns_expense_categories': 'expense-categories',
  'ns_items': 'items',
  'ns_entities_customers': 'customers',
  'ns_entities_vendors': 'vendors',
  'ns_entities_employees': 'employees',
  'ns_ship_methods': 'ship-methods',
};

export default function TableDetailPage() {
  const params = useParams();
  const tableRoute = params.table as string;
  
  // 從路由反推表名
  const tableName = Object.entries(TABLE_ROUTES).find(
    ([_, route]) => route === tableRoute
  )?.[0] || '';
  
  const tableLabel = TABLE_LABELS[tableName] || tableName;
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!tableName) {
      setError('無效的表名');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: fetchedData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .order('netsuite_internal_id', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setData(fetchedData || []);
    } catch (err: any) {
      console.error(`載入 ${tableLabel} 資料錯誤:`, err);
      setError(err.message || '載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tableName) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableRoute]);

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

  const formatBoolean = (value: boolean | null) => {
    if (value === null || value === undefined) return '-';
    return value ? '是' : '否';
  };

  // 如果表名無效，顯示錯誤
  if (!tableName) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Link href="/dashboard/ocr-expense/sync-status">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回同步狀態
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600 dark:text-red-400">
              錯誤：無效的表名
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 取得所有欄位名稱（排除 id）
  const columns = data.length > 0 
    ? Object.keys(data[0]).filter(key => key !== 'id')
    : [];

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
          <h1 className="text-3xl font-bold text-foreground">{tableLabel}資料</h1>
        </div>
        <p className="text-muted-foreground">
          查看 Supabase 中所有 {tableLabel} 的詳細資料
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{tableLabel}列表</CardTitle>
              <CardDescription className="mt-1">
                共 {data.length} 筆記錄
              </CardDescription>
            </div>
            <Button
              onClick={loadData}
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
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <span>目前沒有資料</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column} className="min-w-[120px]">
                        {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={row.id || index}>
                      {columns.map((column) => {
                        const value = row[column];
                        let displayValue: React.ReactNode = value;

                        // 格式化不同類型的值
                        if (value === null || value === undefined) {
                          displayValue = '-';
                        } else if (typeof value === 'boolean') {
                          displayValue = (
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                value
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                                  : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                              }`}
                            >
                              {value ? '是' : '否'}
                            </span>
                          );
                        } else if (column.includes('date') || column.includes('timestamp') || column.includes('_at')) {
                          displayValue = formatDate(value);
                        } else if (typeof value === 'number') {
                          displayValue = value.toLocaleString();
                        } else if (typeof value === 'string' && value.length > 50) {
                          displayValue = (
                            <span className="text-sm text-muted-foreground" title={value}>
                              {value.substring(0, 50)}...
                            </span>
                          );
                        }

                        return (
                          <TableCell key={column} className="text-sm">
                            {displayValue}
                          </TableCell>
                        );
                      })}
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

