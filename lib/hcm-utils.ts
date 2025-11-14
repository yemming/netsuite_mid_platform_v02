/**
 * HCM 系統工具函數
 * 提供各種 HCM 相關的輔助函數
 */

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化日期時間
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化金額
 */
export function formatCurrency(amount: number, currency: string = 'TWD'): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: currency === 'TWD' ? 'TWD' : currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * 計算工作天數
 */
export function calculateWorkDays(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  let days = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 排除週末（週六和週日）
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

/**
 * 計算遲到分鐘數
 */
export function calculateLateMinutes(
  checkInTime: string,
  expectedTime: string
): number {
  const checkIn = new Date(`2000-01-01 ${checkInTime}`);
  const expected = new Date(`2000-01-01 ${expectedTime}`);
  
  const diff = checkIn.getTime() - expected.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  
  return minutes > 0 ? minutes : 0;
}

/**
 * 驗證員工 ID 格式
 */
export function validateEmployeeId(employeeId: string): boolean {
  // 簡單驗證：EMP 開頭 + 數字
  return /^EMP\d+$/.test(employeeId);
}

/**
 * 驗證電子郵件格式
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 驗證電話號碼格式（台灣）
 */
export function validatePhone(phone: string): boolean {
  // 支援格式：0912-345-678 或 0912345678
  return /^09\d{2}[-]?\d{3}[-]?\d{3}$/.test(phone);
}

/**
 * 取得狀態顏色
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    '在職': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    '離職': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    '留停': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    '待審批': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    '已通過': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    '已拒絕': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    '正常': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    '遲到': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    '請假': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    '啟用': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    '停用': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
}

