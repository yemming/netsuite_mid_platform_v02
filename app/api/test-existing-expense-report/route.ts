import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試查詢已存在的 Expense Report
 * 用於檢查 expense items 的結構
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { expenseReportId } = body;

    if (!expenseReportId) {
      return NextResponse.json(
        { error: '請提供 Expense Report ID' },
        { status: 400 }
      );
    }

    const netsuite = getNetSuiteAPIClient();

    console.log(`========================================`);
    console.log(`查詢 Expense Report ID: ${expenseReportId}`);
    console.log(`========================================`);

    try {
      // 查詢已存在的 Expense Report
      const expenseReport = await netsuite.getRecord('expenseReport', expenseReportId);
      
      console.log('========================================');
      console.log('Expense Report 完整結構:');
      console.log(JSON.stringify(expenseReport, null, 2));
      console.log('========================================');
      console.log('Expense Report 所有鍵:');
      console.log(Object.keys(expenseReport));
      console.log('========================================');

      // 檢查 expense 物件的結構
      let expenseItemsCount = 0;
      let expenseItemsDetails: any = null;
      let expenseStructure: any = null;

      if (expenseReport.expense) {
        expenseStructure = expenseReport.expense;
        console.log('expense 物件類型:', typeof expenseReport.expense);
        console.log('expense 是陣列嗎?', Array.isArray(expenseReport.expense));
        console.log('expense 物件結構:', JSON.stringify(expenseReport.expense, null, 2));
        console.log('expense 物件所有鍵:', expenseReport.expense ? Object.keys(expenseReport.expense) : 'N/A');

        // 如果 expense 有 links，表示它是子資源，需要單獨查詢
        if (expenseReport.expense.links && expenseReport.expense.links.length > 0) {
          const expenseLink = expenseReport.expense.links.find((link: any) => link.rel === 'self');
          if (expenseLink) {
            console.log('發現 expense 子資源連結:', expenseLink.href);
            console.log('嘗試查詢 expense 子資源...');
            
            try {
              // 從完整 URL 中提取路徑
              const expenseUrl = expenseLink.href;
              const expensePath = expenseUrl.replace('https://td3018275.suitetalk.api.netsuite.com', '');
              console.log('查詢路徑:', expensePath);
              
              // 查詢 expense 子資源
              const expenseSubResource = await netsuite.request(expensePath, 'GET');
              console.log('Expense 子資源結構:', JSON.stringify(expenseSubResource, null, 2));
              
              // 檢查 expense items
              let expenseItems: any[] = [];
              
              if (expenseSubResource.items && Array.isArray(expenseSubResource.items)) {
                expenseItems = expenseSubResource.items;
                console.log(`✅ Expense items 數量: ${expenseItems.length}`);
              } else if (Array.isArray(expenseSubResource)) {
                expenseItems = expenseSubResource;
                console.log(`✅ Expense items 數量（陣列格式）: ${expenseItems.length}`);
              } else {
                console.warn('⚠️ Expense 子資源中沒有找到 items');
                console.warn('Expense 子資源結構:', Object.keys(expenseSubResource));
              }

              // 查詢每個 expense item 的詳細資訊
              if (expenseItems.length > 0) {
                console.log('查詢每個 expense item 的詳細資訊...');
                const detailedItems = await Promise.all(
                  expenseItems.map(async (item: any, index: number) => {
                    if (item.links && item.links.length > 0) {
                      const itemLink = item.links.find((link: any) => link.rel === 'self');
                      if (itemLink) {
                        try {
                          const itemUrl = itemLink.href;
                          const itemPath = itemUrl.replace('https://td3018275.suitetalk.api.netsuite.com', '');
                          console.log(`查詢 expense item ${index + 1} 路徑:`, itemPath);
                          
                          const itemDetails = await netsuite.request(itemPath, 'GET');
                          console.log(`Expense item ${index + 1} 詳細資訊:`, JSON.stringify(itemDetails, null, 2));
                          return itemDetails;
                        } catch (itemError: any) {
                          console.error(`查詢 expense item ${index + 1} 錯誤:`, itemError.message);
                          return item; // 返回原始 item
                        }
                      }
                    }
                    return item; // 如果沒有 links，返回原始 item
                  })
                );
                
                expenseItemsDetails = detailedItems;
                expenseItemsCount = detailedItems.length;
                console.log(`✅ 取得 ${expenseItemsCount} 個 expense items 的詳細資訊`);
              }
            } catch (subResourceError: any) {
              console.error('查詢 expense 子資源錯誤:', subResourceError.message);
            }
          }
        } else if (Array.isArray(expenseReport.expense)) {
          expenseItemsCount = expenseReport.expense.length;
          expenseItemsDetails = expenseReport.expense;
          console.log(`✅ Expense items 數量（陣列格式）: ${expenseItemsCount}`);
        } else if (expenseReport.expense.items && Array.isArray(expenseReport.expense.items)) {
          expenseItemsCount = expenseReport.expense.items.length;
          expenseItemsDetails = expenseReport.expense.items;
          console.log(`✅ Expense items 數量（items 格式）: ${expenseItemsCount}`);
        } else {
          console.warn('⚠️ expense 物件存在但不是陣列或沒有 items 陣列');
        }
      } else {
        console.warn('⚠️ Expense Report 中沒有 expense 欄位');
      }

      // 檢查其他可能的欄位
      const possibleFields = ['expenses', 'expenseItems', 'lineItems', 'items', 'lines'];
      for (const field of possibleFields) {
        if (expenseReport[field]) {
          console.log(`發現可能的 expense items 欄位: ${field}`, expenseReport[field]);
        }
      }

      return NextResponse.json({
        success: true,
        expense_report_id: expenseReportId,
        expense_report: expenseReport,
        expense_structure: expenseStructure,
        expense_items_count: expenseItemsCount,
        expense_items_details: expenseItemsDetails,
        all_keys: Object.keys(expenseReport),
        note: expenseItemsCount === 0 
          ? '⚠️ 警告：Expense Report 中沒有 expense items' 
          : `✅ 找到 ${expenseItemsCount} 個 expense items`,
      });

    } catch (queryError: any) {
      console.error('查詢 Expense Report 錯誤:', queryError);
      return NextResponse.json(
        {
          success: false,
          error: '查詢失敗',
          message: queryError.message || queryError.toString(),
          details: queryError,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('測試查詢 Expense Report 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '未知錯誤',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

