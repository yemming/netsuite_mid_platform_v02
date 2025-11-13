'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, ExternalLink, BarChart3, LineChart, Table as TableIcon, Move, Box, Palette, LucideIcon } from 'lucide-react';
import Link from 'next/link';

// 工具圖示組件
function ToolIcon({ iconUrl, fallbackIcon: FallbackIcon, alt }: { iconUrl: string; fallbackIcon: LucideIcon; alt: string }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return <FallbackIcon className="h-6 w-6 text-white" />;
  }

  return (
    <img
      src={iconUrl}
      alt={alt}
      className="w-6 h-6 object-contain"
      onError={() => setImgError(true)}
    />
  );
}

// 工具資料
const tools = [
  {
    name: 'Tremor',
    description: 'React 圖表元件庫',
    internalUrl: '/dashboard/nextjs-toolbox/tremor',
    externalUrl: 'https://www.tremor.so/docs/visualizations/area-chart',
    icon: BarChart3,
    iconUrl: 'https://www.google.com/s2/favicons?domain=tremor.so&sz=64',
  },
  {
    name: 'Recharts',
    description: '強大的 React 圖表庫',
    internalUrl: '/dashboard/nextjs-toolbox/recharts',
    externalUrl: 'https://recharts.github.io/en-US/examples/',
    icon: LineChart,
    iconUrl: 'https://www.google.com/s2/favicons?domain=recharts.github.io&sz=64',
  },
  {
    name: 'TanStack Table',
    description: '功能豐富的表格元件',
    internalUrl: '/dashboard/nextjs-toolbox/tanstack-table',
    externalUrl: 'https://tanstack.com/table/latest',
    icon: TableIcon,
    iconUrl: 'https://www.google.com/s2/favicons?domain=tanstack.com&sz=64',
  },
  {
    name: 'dnd-kit',
    description: '核心拖拽引擎',
    internalUrl: '/dashboard/nextjs-toolbox/dnd-kit',
    externalUrl: 'https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/?path=/story/core-draggable-hooks-usedraggable--basic-setup',
    icon: Move,
    iconUrl: 'https://www.google.com/s2/favicons?domain=dndkit.com&sz=64',
  },
  {
    name: 'Zustand',
    description: '輕量級狀態管理',
    internalUrl: '/dashboard/nextjs-toolbox/zustand',
    externalUrl: 'https://zustand-demo.pmnd.rs/',
    icon: Box,
    iconUrl: 'https://www.google.com/s2/favicons?domain=zustand-demo.pmnd.rs&sz=64',
  },
  {
    name: 'Dribbble',
    description: '豐富的網站設計樣板',
    internalUrl: null,
    externalUrl: 'https://dribbble.com/',
    icon: Palette,
    iconUrl: 'https://www.google.com/s2/favicons?domain=dribbble.com&sz=64',
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool, index) => {
              const IconComponent = tool.icon;
              const hasExternalUrl = !!tool.externalUrl;
              const hasInternalUrl = !!tool.internalUrl;

              return (
                <Card
                  key={index}
                  className={`h-full transition-all duration-200 hover:shadow-lg hover:scale-105 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600 group ${
                    hasExternalUrl ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (hasExternalUrl) {
                      window.open(tool.externalUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* 工具圖示 */}
                      <div className="flex-shrink-0">
                        <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                          <ToolIcon
                            iconUrl={tool.iconUrl}
                            fallbackIcon={IconComponent}
                            alt={`${tool.name} icon`}
                          />
                        </div>
                      </div>
                      
                      {/* 工具資訊 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {tool.description}
                        </p>
                        {hasInternalUrl ? (
                          <Link
                            href={tool.internalUrl}
                            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="truncate">查看文件</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </Link>
                        ) : hasExternalUrl ? (
                          <a
                            href={tool.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="truncate">查看文件</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

