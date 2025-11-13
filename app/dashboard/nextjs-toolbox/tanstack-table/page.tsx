'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 範例數據類型
type Person = {
  id: number;
  name: string;
  email: string;
  age: number;
  role: string;
  status: '活躍' | '一般' | '休眠';
  salary: number;
  joinDate: string;
};

// 範例數據
const defaultData: Person[] = [
  { id: 1, name: '張三', email: 'zhang@example.com', age: 28, role: '前端工程師', status: '活躍', salary: 80000, joinDate: '2022-01-15' },
  { id: 2, name: '李四', email: 'li@example.com', age: 32, role: '後端工程師', status: '活躍', salary: 95000, joinDate: '2021-06-20' },
  { id: 3, name: '王五', email: 'wang@example.com', age: 25, role: 'UI設計師', status: '一般', salary: 70000, joinDate: '2023-03-10' },
  { id: 4, name: '趙六', email: 'zhao@example.com', age: 35, role: '產品經理', status: '活躍', salary: 120000, joinDate: '2020-09-05' },
  { id: 5, name: '錢七', email: 'qian@example.com', age: 29, role: '前端工程師', status: '一般', salary: 85000, joinDate: '2022-11-18' },
  { id: 6, name: '孫八', email: 'sun@example.com', age: 31, role: '後端工程師', status: '活躍', salary: 100000, joinDate: '2021-08-22' },
  { id: 7, name: '周九', email: 'zhou@example.com', age: 27, role: '測試工程師', status: '一般', salary: 65000, joinDate: '2023-05-30' },
  { id: 8, name: '吳十', email: 'wu@example.com', age: 33, role: '架構師', status: '活躍', salary: 150000, joinDate: '2019-12-01' },
  { id: 9, name: '鄭十一', email: 'zheng@example.com', age: 26, role: 'UI設計師', status: '休眠', salary: 72000, joinDate: '2023-01-08' },
  { id: 10, name: '王十二', email: 'wang2@example.com', age: 30, role: '產品經理', status: '活躍', salary: 110000, joinDate: '2022-04-15' },
];

const columnHelper = createColumnHelper<Person>();

export default function TanStackTableShowcasePage() {
  const [data] = useState<Person[]>(defaultData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // 定義欄位
  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
      columnHelper.accessor('name', {
        header: '姓名',
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
      columnHelper.accessor('email', {
        header: '電子郵件',
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
      columnHelper.accessor('age', {
        header: '年齡',
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
      columnHelper.accessor('role', {
        header: '職位',
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
      columnHelper.accessor('status', {
        header: '狀態',
        cell: (info) => {
          const status = info.getValue();
          const statusColors = {
            活躍: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            一般: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            休眠: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
          };
          return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status]}`}>
              {status}
            </span>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor('salary', {
        header: '薪資',
        cell: (info) => `$${info.getValue().toLocaleString()}`,
        enableSorting: true,
      }),
      columnHelper.accessor('joinDate', {
        header: '入職日期',
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
    ],
    []
  );

  // 建立表格實例
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            TanStack Table 展示 - 強大的表格解決方案
          </CardTitle>
        </CardHeader>
      </Card>

      {/* 功能說明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">功能特色</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">排序功能</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">點擊欄位標題進行排序</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">篩選功能</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">使用全域搜尋或欄位篩選</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">分頁功能</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">自動分頁與導航控制</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">響應式設計</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">適配各種螢幕尺寸</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 表格卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>員工資料表</CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <Input
              placeholder="全域搜尋..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <div className="text-sm text-gray-500 dark:text-gray-400">
              共 {table.getFilteredRowModel().rows.length} 筆資料
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b bg-gray-50 dark:bg-gray-800">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={
                              header.column.getCanSort()
                                ? 'cursor-pointer select-none flex items-center gap-2 hover:text-gray-900 dark:hover:text-white'
                                : ''
                            }
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: ' ↑',
                              desc: ' ↓',
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                      沒有找到符合條件的資料
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 分頁控制 */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                首頁
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                上一頁
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                下一頁
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                末頁
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                第 {table.getState().pagination.pageIndex + 1} 頁，共 {table.getPageCount()} 頁
              </span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
                className="px-2 py-1 border rounded text-sm"
              >
                {[5, 10, 20, 30, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    每頁 {pageSize} 筆
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 進階功能展示 */}
      <Card>
        <CardHeader>
          <CardTitle>進階功能展示</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">當前排序狀態</h3>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                {sorting.length === 0 ? (
                  <span className="text-gray-500">無排序</span>
                ) : (
                  <div className="space-y-1">
                    {sorting.map((sort) => (
                      <div key={sort.id}>
                        {sort.id}: {sort.desc ? '降序 ↓' : '升序 ↑'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">當前篩選狀態</h3>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                {columnFilters.length === 0 && !globalFilter ? (
                  <span className="text-gray-500">無篩選</span>
                ) : (
                  <div className="space-y-1">
                    {globalFilter && <div>全域搜尋: &quot;{globalFilter}&quot;</div>}
                    {columnFilters.map((filter) => (
                      <div key={filter.id}>
                        {filter.id}: {String(filter.value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
