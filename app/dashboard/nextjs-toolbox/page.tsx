'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wrench, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// 工具資料
const tools = [
  {
    description: 'Tremor - React 圖表元件庫',
    url: 'https://www.tremor.so/docs/visualizations/area-chart',
  },
  {
    description: 'Recharts - 強大的 React 圖表庫',
    url: 'https://recharts.github.io/en-US/examples/',
  },
  {
    description: 'TanStack Table - 功能豐富的表格元件',
    url: '/dashboard/nextjs-toolbox/tanstack-table',
  },
  {
    description: 'dnd-kit - 核心拖拽引擎',
    url: 'https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/?path=/story/core-draggable-hooks-usedraggable--basic-setup',
  },
  {
    description: 'Zustand - 輕量級狀態管理',
    url: '/dashboard/nextjs-toolbox/zustand',
  },
];

export default function NextJSToolboxPage() {
  return (
    <div className="container mx-auto p-6">
      <Card className="dark:bg-[#1a2332] dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Wrench className="h-5 w-5" />
            Next.JS工具箱
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="dark:border-gray-700">
                <TableHead className="dark:text-gray-300">工具說明</TableHead>
                <TableHead className="dark:text-gray-300">工具網頁</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map((tool, index) => (
                <TableRow key={index} className="dark:border-gray-700 dark:hover:bg-gray-800">
                  <TableCell className="dark:text-gray-300">{tool.description}</TableCell>
                  <TableCell>
                    {tool.url.startsWith('http') ? (
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                      >
                        {tool.url}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <Link
                        href={tool.url}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                      >
                        {tool.url}
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

