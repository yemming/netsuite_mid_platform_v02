/**
 * LINE Pay 付款狀態快取（記憶體）
 * 用於 Mock 模式追蹤付款狀態
 * 實際應該使用 Redis 或資料庫
 */

const paymentStatusCache = new Map<string, 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED'>();

export const linePayCache = {
  /**
   * 設定付款狀態
   */
  setStatus(transactionId: string, status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED') {
    paymentStatusCache.set(transactionId, status);
  },

  /**
   * 取得付款狀態
   */
  getStatus(transactionId: string): 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED' | null {
    return paymentStatusCache.get(transactionId) || null;
  },

  /**
   * 清除狀態
   */
  clearStatus(transactionId: string) {
    paymentStatusCache.delete(transactionId);
  },
};

