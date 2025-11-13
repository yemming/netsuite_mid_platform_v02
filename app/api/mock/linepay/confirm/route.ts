import { NextRequest, NextResponse } from 'next/server';
import { linePayCache } from '@/lib/linepay-cache';

/**
 * 假的 LINE Pay 付款確認 API
 * 模擬 LINE Pay 的 confirm API，用於測試流程
 */
export async function POST(req: NextRequest) {
  try {
    const { transactionId, orderId, amount } = await req.json();

    if (!transactionId || !orderId) {
      return NextResponse.json(
        { returnCode: 'L001', returnMessage: '缺少必要參數' },
        { status: 400 }
      );
    }

    // 模擬確認處理時間
    await new Promise(resolve => setTimeout(resolve, 800));

    // 標記為已確認（寫入記憶體快取）
    linePayCache.setStatus(transactionId, 'CONFIRMED');

    // 模擬確認成功
    const mockResponse = {
      returnCode: '0000',
      returnMessage: 'Success',
      info: {
        orderId,
        transactionId,
        payStatus: 'CONFIRMED',
        payInfo: [
          {
            method: 'BALANCE',
            amount: amount || 1000,
          },
        ],
      },
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('LINE Pay Confirm Error:', error);
    return NextResponse.json(
      { returnCode: 'L999', returnMessage: '系統錯誤' },
      { status: 500 }
    );
  }
}

