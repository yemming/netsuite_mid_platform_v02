/**
 * LINE Pay 管理工具類別
 * 處理 LINE Pay 的付款請求和確認流程
 */

export interface LinePayRequestResponse {
  success: boolean;
  paymentUrl?: string;
  qrCodeUrl?: string;
  transactionId?: string;
  error?: string;
}

export interface LinePayStatusResponse {
  success: boolean;
  status?: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';
  error?: string;
}

export interface LinePayConfirmResponse {
  success: boolean;
  error?: string;
}

export class LinePayManager {
  private useMock: boolean;

  constructor() {
    // 從環境變數判斷是否使用 Mock API
    this.useMock = process.env.NEXT_PUBLIC_USE_MOCK_PAYMENT === 'true';
  }

  /**
   * 請求 LINE Pay 付款
   * @param orderId 訂單編號
   * @param amount 付款金額
   * @param productName 商品名稱
   */
  async requestPayment(
    orderId: string,
    amount: number,
    productName?: string
  ): Promise<LinePayRequestResponse> {
    try {
      const endpoint = this.useMock
        ? '/api/mock/linepay/request' // 假的
        : '/api/payment/linepay/request'; // 真的（未來實作）

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
          productName: productName || `訂單 ${orderId}`,
        }),
      });

      const data = await response.json();

      if (data.returnCode === '0000') {
        return {
          success: true,
          paymentUrl: data.info.paymentUrl.web,
          qrCodeUrl: data.info.qrCodeUrl || data.info.paymentUrl.web,
          transactionId: data.info.transactionId,
        };
      }

      return {
        success: false,
        error: data.returnMessage || '付款請求失敗',
      };
    } catch (error) {
      console.error('LINE Pay Request Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '付款請求失敗',
      };
    }
  }

  /**
   * 確認 LINE Pay 付款
   * @param transactionId 交易編號
   * @param orderId 訂單編號
   * @param amount 付款金額
   */
  async confirmPayment(
    transactionId: string,
    orderId: string,
    amount: number
  ): Promise<LinePayConfirmResponse> {
    try {
      const endpoint = this.useMock
        ? '/api/mock/linepay/confirm'
        : '/api/payment/linepay/confirm'; // 真的（未來實作）

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, orderId, amount }),
      });

      const data = await response.json();

      return data.returnCode === '0000'
        ? { success: true }
        : { success: false, error: data.returnMessage || '付款確認失敗' };
    } catch (error) {
      console.error('LINE Pay Confirm Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '付款確認失敗',
      };
    }
  }

  /**
   * 查詢付款狀態
   * @param transactionId 交易編號
   * @param orderId 訂單編號
   */
  async checkPaymentStatus(
    transactionId: string,
    orderId: string
  ): Promise<LinePayStatusResponse> {
    try {
      const endpoint = this.useMock
        ? '/api/mock/linepay/status'
        : '/api/payment/linepay/status'; // 真的（未來實作）

      const response = await fetch(
        `${endpoint}?transactionId=${transactionId}&orderId=${orderId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      if (data.returnCode === '0000') {
        return {
          success: true,
          status: data.info.payStatus || 'PENDING',
        };
      }

      return {
        success: false,
        error: data.returnMessage || '查詢狀態失敗',
      };
    } catch (error) {
      console.error('LINE Pay Status Check Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '查詢狀態失敗',
      };
    }
  }
}

// 匯出單例
export const linePayManager = new LinePayManager();

