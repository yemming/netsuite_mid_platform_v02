import { NextRequest, NextResponse } from 'next/server';
import { linePayCache } from '@/lib/linepay-cache';

/**
 * 查詢 LINE Pay 付款狀態 API
 * 用於輪詢付款狀態
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId');
    const orderId = searchParams.get('orderId');

    if (!transactionId || !orderId) {
      return NextResponse.json(
        { returnCode: 'L001', returnMessage: '缺少必要參數' },
        { status: 400 }
      );
    }

    // 模擬查詢延遲
    await new Promise(resolve => setTimeout(resolve, 300));

    // 從記憶體快取查詢狀態（實際應該從資料庫查詢）
    const status = linePayCache.getStatus(transactionId);
    const isConfirmed = status === 'CONFIRMED';

    if (isConfirmed) {
      return NextResponse.json({
        returnCode: '0000',
        returnMessage: 'Success',
        info: {
          orderId,
          transactionId,
          payStatus: 'CONFIRMED',
          payInfo: [
            {
              method: 'BALANCE',
              amount: 1000, // 實際應該從資料庫取得
            },
          ],
        },
      });
    }

    // 預設為待處理
    return NextResponse.json({
      returnCode: '0000',
      returnMessage: 'Pending',
      info: {
        orderId,
        transactionId,
        payStatus: 'PENDING',
      },
    });
  } catch (error) {
    console.error('LINE Pay Status Error:', error);
    return NextResponse.json(
      { returnCode: 'L999', returnMessage: '系統錯誤' },
      { status: 500 }
    );
  }
}

