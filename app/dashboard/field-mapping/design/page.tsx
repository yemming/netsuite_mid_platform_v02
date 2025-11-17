'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Database, Settings } from 'lucide-react';

interface TableMapping {
  mapping_key: string;
  label: string;
  supabase_table_name: string;
  netsuite_table_name: string;
  priority: string;
  is_enabled: boolean;
  sync_order: number;
}

export default function FieldMappingDesignListPage() {
  const router = useRouter();
  const [tables, setTables] = useState<TableMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 載入表列表
  const loadTables = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/table-mapping');
      const result = await response.json();

      if (result.success) {
        setTables(result.data.mappings || []);
      }
    } catch (error: any) {
      console.error('載入表列表失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  // 過濾表
  const filteredTables = tables.filter((table) => {
    const query = searchQuery.toLowerCase();
    return (
      table.label.toLowerCase().includes(query) ||
      table.mapping_key.toLowerCase().includes(query) ||
      table.supabase_table_name.toLowerCase().includes(query) ||
      table.netsuite_table_name.toLowerCase().includes(query)
    );
  });

  // 按優先級和同步順序排序
  const sortedTables = [...filteredTables].sort((a, b) => {
    // 先按 sync_order
    if (a.sync_order !== b.sync_order) {
      return (a.sync_order || 999) - (b.sync_order || 999);
    }
    // 再按 label
    return a.label.localeCompare(b.label, 'zh-TW');
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">欄位映射設計</h1>
          <p className="text-muted-foreground mt-2">
            選擇 NetSuite 表來設計欄位映射關係
          </p>
        </div>
        <Button onClick={loadTables} variant="outline" disabled={loading}>
          <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          重新載入
        </Button>
      </div>

      {/* 搜尋框 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋表名稱、映射鍵或表名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 表列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : sortedTables.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? '沒有找到符合搜尋條件的表' : '目前沒有可用的表'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTables.map((table) => (
            <Card
              key={table.mapping_key}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/field-mapping/design/${table.mapping_key}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{table.label}</CardTitle>
                    <CardDescription className="mt-1">
                      {table.mapping_key}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={table.priority === '🔴 最高' ? 'destructive' : 'secondary'}
                    className="ml-2"
                  >
                    {table.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">NetSuite:</span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {table.netsuite_table_name}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Supabase:</span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {table.supabase_table_name}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

