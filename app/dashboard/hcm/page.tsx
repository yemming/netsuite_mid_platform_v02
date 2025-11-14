import { redirect } from 'next/navigation';

/**
 * HCM 系統入口頁面
 * 導向人事管理頁面
 */
export default function HCMViewPage() {
  redirect('/dashboard/hcm/admin/employees');
}

