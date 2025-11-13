import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * 假的 LINE Pay 付款請求 API
 * 模擬 LINE Pay 的 request API，用於測試流程
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, productName } = await req.json();

    if (!orderId || !amount) {
      return NextResponse.json(
        { returnCode: 'L001', returnMessage: '缺少必要參數' },
        { status: 400 }
      );
    }

    // 模擬 LINE Pay 的延遲（讓它看起來真實一點）
    await new Promise(resolve => setTimeout(resolve, 500));

    // 生成假的交易 ID
    const transactionId = `MOCK${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const paymentAccessToken = `mock_token_${randomUUID()}`;

    // 生成 QR Code URL（模擬 LINE Pay 的付款條碼）
    // 實際 LINE Pay 會返回一個付款條碼 URL，這裡我們用一個假的 URL
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/mock/linepay/payment?transactionId=${transactionId}&orderId=${orderId}&amount=${amount}`;

    // 模擬成功回應
    const mockResponse = {
      returnCode: '0000',
      returnMessage: 'Success',
      info: {
        paymentUrl: {
          web: qrCodeUrl,
          app: `line://pay/payment/${transactionId}`,
        },
        qrCodeUrl: qrCodeUrl, // 用於產生 QR Code
        transactionId,
        paymentAccessToken,
      },
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('LINE Pay Request Error:', error);
    return NextResponse.json(
      { returnCode: 'L999', returnMessage: '系統錯誤' },
      { status: 500 }
    );
  }
}

