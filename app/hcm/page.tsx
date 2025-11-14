import { redirect } from 'next/navigation';

/**
 * HCM 系統入口頁面
 * 根據使用者角色導向對應的儀表板
 */
export default function HCMPortalPage() {
  // TODO: 實作身份驗證和角色判斷
  // 暫時導向核心應用程式
  redirect('/hcm/admin/employees');
}

