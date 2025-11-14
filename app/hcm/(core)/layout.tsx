import { Sidebar } from '@/components/hcm/sidebar';
import { HCMHeader } from '@/components/hcm/header';

/**
 * HCM 核心應用程式 Layout
 * 提供統一的 AppShell，包含側邊欄和頂部導航
 */
export default function HCMCoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* 側邊欄 */}
      <Sidebar />
      
      {/* 主內容區 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 頂部導航 */}
        <HCMHeader />
        
        {/* 頁面內容 */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

