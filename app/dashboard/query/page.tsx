'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Terminal, Play, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

type ResultFormat = 'Table' | 'CSV' | 'JSON';

function UniversalSQLDownloaderContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('SELECT * FROM customer');
  const [selectedFormat, setSelectedFormat] = useState<ResultFormat>('Table');
  const [enablePagination, setEnablePagination] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(200);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [allResults, setAllResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultInfo, setResultInfo] = useState<string | null>(null);
  const [shouldAutoRun, setShouldAutoRun] = useState(false);

  // 從 URL 參數讀取查詢並自動執行
  useEffect(() => {
    const queryParam = searchParams.get('query');
    if (queryParam) {
      const decodedQuery = decodeURIComponent(queryParam);
      setQuery(decodedQuery);
      // 標記需要自動執行查詢
      setShouldAutoRun(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 當應該自動執行查詢時觸發
  useEffect(() => {
    if (shouldAutoRun && query && !loading) {
      setShouldAutoRun(false);
      handleRunQuery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoRun, query, loading]);

  const handleRunQuery = async () => {
    setLoading(true);
    setError(null);
    setAllResults([]);
    setCurrentPage(1);
    setSortColumn(null);
    setSortDirection('asc');
    setResultInfo(null);

    try {
      const response = await fetch('/api/suiteql-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, format: selectedFormat }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '執行查詢失敗');
      }

      // Handle downloadable formats (CSV, JSON)
      if (selectedFormat === 'CSV' || selectedFormat === 'JSON') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `suiteql_results_${timestamp}.${selectedFormat.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        // Also fetch preview data for display
        const previewResponse = await fetch('/api/suiteql-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, format: 'Table' }),
        });
        
        if (previewResponse.ok) {
          const previewData = await previewResponse.json();
          setAllResults(previewData.rows || []);
          setResultInfo(
            `已下載 ${selectedFormat} 檔案。預覽：已取得 ${previewData.rowCount || 0} 筆記錄，耗時 ${previewData.timeTaken || 0}ms`
          );
        } else {
          setResultInfo(`已下載 ${selectedFormat} 檔案`);
        }
      } else {
        // Table format - parse JSON
        const data = await response.json();
        setAllResults(data.rows || []);
        setResultInfo(
          `已取得 ${data.rowCount || 0} 筆記錄${data.hasMore ? ' (還有更多)' : ''}，耗時 ${data.timeTaken || 0}ms`
        );
      }
    } catch (err: any) {
      setError(err.message || '發生未知錯誤');
      console.error('Query execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 處理排序
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // 排序資料
  const getSortedData = () => {
    if (!sortColumn || allResults.length === 0) return allResults;
    
    const sorted = [...allResults].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
    
    return sorted;
  };

  // 取得分頁後的資料
  const getPaginatedData = () => {
    const sortedData = getSortedData();
    
    if (!enablePagination) return sortedData;
    
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const totalPages = enablePagination 
    ? Math.ceil(allResults.length / rowsPerPage) 
    : 1;

  const renderResultsTable = () => {
    const paginatedResults = getPaginatedData();
    
    if (paginatedResults.length === 0 || allResults.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          沒有資料可顯示
        </div>
      );
    }

    const headers = Object.keys(allResults[0]);

    return (
      <>
        {/* 分頁控制 */}
        {enablePagination && totalPages > 1 && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div className="text-sm text-muted-foreground">
              共 {allResults.length} 筆記錄，第 {currentPage} / {totalPages} 頁
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-4">
                第 {currentPage} / {totalPages} 頁
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50 dark:bg-blue-950/30">
                {headers.map((header) => (
                  <TableHead 
                    key={header} 
                    className="font-semibold cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 select-none bg-blue-50 dark:bg-blue-950/30"
                    onClick={() => handleSort(header)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{header}</span>
                      {sortColumn === header && (
                        <span className="text-primary">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResults.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map((header) => {
                    const value = row[header];
                    const isNull = value === null || value === undefined;
                    
                    let displayValue = '';
                    if (isNull) {
                      displayValue = 'null';
                    } else if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else {
                      displayValue = String(value);
                    }

                    return (
                      <TableCell
                        key={`${rowIndex}-${header}`}
                      >
                        {displayValue}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Terminal className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">SuiteQL 查詢工具</h1>
        </div>
        <p className="text-muted-foreground">
          執行 SuiteQL 查詢並以多種格式下載結果
        </p>
      </div>

      {/* Query Editor Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>查詢設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="輸入 SuiteQL 查詢語句，例如：SELECT * FROM customer"
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleRunQuery}
                disabled={loading || !query.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                {loading ? '執行中...' : 'Run Query'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>選項</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enable-pagination"
                checked={enablePagination}
                onCheckedChange={(checked) => {
                  setEnablePagination(checked as boolean);
                  setCurrentPage(1);
                }}
              />
              <Label htmlFor="enable-pagination" className="font-normal cursor-pointer">
                啟用分頁選項
              </Label>
            </div>
            {enablePagination && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="rows-per-page" className="text-sm">
                  每頁筆數：
                </Label>
                <Input
                  id="rows-per-page"
                  type="number"
                  min="1"
                  value={rowsPerPage}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 200;
                    setRowsPerPage(Math.max(1, value));
                    setCurrentPage(1);
                  }}
                  className="w-20"
                />
              </div>
            )}
          </div>

          <div>
            <Label className="mb-3 block font-semibold">結果格式：</Label>
            <RadioGroup
              value={selectedFormat}
              onValueChange={(value) => setSelectedFormat(value as ResultFormat)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Table" id="format-table" />
                <Label htmlFor="format-table" className="font-normal cursor-pointer">表格</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CSV" id="format-csv" />
                <Label htmlFor="format-csv" className="font-normal cursor-pointer">CSV</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="JSON" id="format-json" />
                <Label htmlFor="format-json" className="font-normal cursor-pointer">JSON</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card>
        <CardHeader>
          <CardTitle>結果</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center text-primary py-8">
              <div className="inline-flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                載入中...
              </div>
            </div>
          )}
          
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 mb-4">
              <p className="text-destructive font-semibold">錯誤：</p>
              <p className="text-destructive/80 text-sm mt-1">{error}</p>
            </div>
          )}
          
          {resultInfo && !error && (
            <p className="mb-4 text-sm text-muted-foreground">{resultInfo}</p>
          )}
          
          {!loading && !error && (selectedFormat === 'Table' || 
            (selectedFormat === 'CSV' || selectedFormat === 'JSON')) && allResults.length > 0 && (
            renderResultsTable()
          )}
          
          {!loading && !error && allResults.length === 0 && !error && (
            <div className="text-center text-muted-foreground py-8">
              點擊 "Run Query" 執行查詢以查看結果
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UniversalSQLDownloaderPage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            載入中...
          </div>
        </div>
      </div>
    }>
      <UniversalSQLDownloaderContent />
    </Suspense>
  );
}

