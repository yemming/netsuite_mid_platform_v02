import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 取得 NetSuite Invoice 列表
 * 用於 PDF 模板編輯器的測試資料選擇
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const q = searchParams.get('q') || ''; // 搜尋關鍵字

    const netsuite = getNetSuiteAPIClient();

    // 使用 SuiteQL 查詢 invoice 資料
    // NetSuite 的 transaction 表中，invoice 的 type 是 'CustInvc'
    // 注意：transaction 表可能沒有 total 欄位，先查詢基本欄位
    // 金額需要從 transactionLine 表計算或使用 REST API 取得
    let suiteqlQuery = `
      SELECT 
        id,
        tranid,
        entity,
        trandate,
        duedate,
        status,
        currency,
        memo,
        createddate,
        lastmodifieddate
      FROM transaction
      WHERE type = 'CustInvc'
    `;

    // 如果有搜尋關鍵字，加入 WHERE 條件
    // NetSuite SuiteQL 使用 LIKE（不區分大小寫）而不是 ILIKE
    if (q) {
      suiteqlQuery += ` AND (tranid LIKE '%${q}%' OR entity LIKE '%${q}%')`;
    }

    suiteqlQuery += ` ORDER BY trandate DESC, id DESC`;

    // 執行查詢（不取得所有資料，只取得需要的數量）
    const result = await netsuite.executeSuiteQL(suiteqlQuery, {
      fetchAll: false,
      maxRecords: limit + offset, // 取得足夠的資料以便分頁
    });

    const allItems = result.items || [];
    
    // 手動實作分頁
    const paginatedItems = allItems.slice(offset, offset + limit);
    
    // 轉換資料格式，符合 PDF 模板需要的格式
    const invoices = paginatedItems.map((item: any) => ({
      id: item.id,
      tranid: item.tranid || `INV-${item.id}`,
      entity: item.entity || '未知客戶',
      trandate: item.trandate || new Date().toISOString().split('T')[0],
      duedate: item.duedate || null,
      status: item.status || 'Pending',
      statusColor: getStatusColor(item.status),
      amount: formatAmount(item.amount || item.total || item.subtotal || 0, item.currency),
      currency: item.currency || 'TWD',
      memo: item.memo || '',
      createdAt: item.createddate || new Date().toISOString(),
      updatedAt: item.lastmodifieddate || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: invoices,
        total: allItems.length,
        limit,
        offset,
        hasMore: offset + limit < allItems.length,
      },
    });
  } catch (error: any) {
    console.error('取得 Invoice 列表錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '取得 Invoice 列表失敗',
        message: error.message || '無法從 NetSuite 取得 Invoice 資料',
      },
      { status: 500 }
    );
  }
}

/**
 * 根據狀態取得對應的顏色
 */
function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    'Pending': '#f59e0b', // 橘色
    'Pending Approval': '#f59e0b',
    'Pending Fulfillment': '#f59e0b',
    'Pending Billing': '#f59e0b',
    'Closed': '#10b981', // 綠色
    'Voided': '#ef4444', // 紅色
    'Paid': '#10b981',
    'Partially Paid': '#3b82f6', // 藍色
  };
  
  return statusMap[status] || '#6b7280'; // 預設灰色
}

/**
 * 格式化金額
 */
function formatAmount(amount: number | string | null, currency: string = 'TWD'): string {
  if (!amount) return 'NT$ 0.00';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return 'NT$ 0.00';
  
  const currencySymbol: Record<string, string> = {
    'TWD': 'NT$',
    'USD': '$',
    'EUR': '€',
    'JPY': '¥',
    'CNY': '¥',
  };
  
  const symbol = currencySymbol[currency] || currency;
  
  // 格式化數字，千分位逗號
  const formatted = numAmount.toLocaleString('zh-TW', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${symbol} ${formatted}`;
}

