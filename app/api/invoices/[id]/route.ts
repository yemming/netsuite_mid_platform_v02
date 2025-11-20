import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 取得單一 NetSuite Invoice 詳細資料
 * 用於 PDF 模板編輯器的測試資料
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const netsuite = getNetSuiteAPIClient();

    // 方法 1: 嘗試使用 REST API 取得詳細資料
    let invoiceData: any = null;
    
    try {
      // NetSuite REST API 的 invoice record type 是 customerinvoice
      invoiceData = await netsuite.getRecord('customerinvoice', invoiceId);
    } catch (restError: any) {
      console.warn('REST API 取得失敗，改用 SuiteQL:', restError.message);
      
      // 方法 2: 使用 SuiteQL 查詢
      try {
        const suiteqlQuery = `
          SELECT 
            id,
            tranid,
            entity,
            trandate,
            duedate,
            status,
            total as amount,
            currency,
            memo,
            createddate,
            lastmodifieddate,
            location,
            department,
            class,
            subsidiary
          FROM transaction
          WHERE type = 'CustInvc'
          AND id = ${invoiceId}
        `;

        const result = await netsuite.executeSuiteQL(suiteqlQuery, {
          fetchAll: false,
        });

        if (result.items && result.items.length > 0) {
          invoiceData = result.items[0];
        } else {
          return NextResponse.json(
            {
              success: false,
              error: '找不到 Invoice',
              message: `找不到 ID 為 ${invoiceId} 的 Invoice`,
            },
            { status: 404 }
          );
        }
      } catch (suiteqlError: any) {
        console.error('SuiteQL 查詢錯誤:', suiteqlError);
        throw new Error(`無法取得 Invoice 資料: ${suiteqlError.message}`);
      }
    }

    // 轉換資料格式，符合 PDF 模板需要的格式
    const formattedData = {
      id: invoiceData.id,
      tranid: invoiceData.tranid || invoiceData.tranId || `INV-${invoiceData.id}`,
      entity: invoiceData.entity?.name || invoiceData.entity || '未知客戶',
      trandate: invoiceData.trandate || invoiceData.tranDate || new Date().toISOString().split('T')[0],
      duedate: invoiceData.duedate || invoiceData.dueDate || null,
      status: invoiceData.status?.name || invoiceData.status || 'Pending',
      statusColor: getStatusColor(invoiceData.status?.name || invoiceData.status),
      amount: formatAmount(
        invoiceData.amount,
        invoiceData.currency?.name || invoiceData.currency || 'TWD'
      ),
      currency: invoiceData.currency?.name || invoiceData.currency || 'TWD',
      memo: invoiceData.memo || '',
      location: invoiceData.location?.name || invoiceData.location || '',
      department: invoiceData.department?.name || invoiceData.department || '',
      class: invoiceData.class?.name || invoiceData.class || '',
      subsidiary: invoiceData.subsidiary?.name || invoiceData.subsidiary || '',
      createdAt: invoiceData.createddate || invoiceData.createdDate || new Date().toISOString(),
      updatedAt: invoiceData.lastmodifieddate || invoiceData.lastModifiedDate || new Date().toISOString(),
      // 原始資料（供參考）
      raw: invoiceData,
    };

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error: any) {
    console.error('取得 Invoice 詳細資料錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '取得 Invoice 詳細資料失敗',
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
    'Pending': '#f59e0b',
    'Pending Approval': '#f59e0b',
    'Pending Fulfillment': '#f59e0b',
    'Pending Billing': '#f59e0b',
    'Closed': '#10b981',
    'Voided': '#ef4444',
    'Paid': '#10b981',
    'Partially Paid': '#3b82f6',
  };
  
  return statusMap[status] || '#6b7280';
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
  
  const formatted = numAmount.toLocaleString('zh-TW', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${symbol} ${formatted}`;
}

