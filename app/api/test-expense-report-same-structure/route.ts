import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試建立 Expense Report（使用與成功範例相同的結構）
 * 根據查詢到的成功 Expense Report (ID: 22853) 的結構來建立
 */
export async function POST(request: Request) {
  try {
    const netsuite = getNetSuiteAPIClient();

    // 根據成功的 Expense Report (ID: 22853) 的結構來建立
    // 成功的結構：
    // - entity: "15" (Aubrey Pober)
    // - subsidiary: "1" (US - West)
    // - trandate: "2025-11-09"
    // - memo: "測試費用報告 - Claude AI 自動創建"
    // - expense item:
    //   - category: "7" (Lunch)
    //   - amount: 10
    //   - currency: "1" (US Dollars) - 但這個可能不需要，因為 header 已經有 currency
    //   - expensedate: "2025-11-09"
    //   - memo: "測試項目 - 約台幣300元午餐"

    // 測試 1: 完全複製成功的結構（但不包含 currency，因為 header 已經有）
    const testPayload1 = {
      entity: {
        id: "15"  // 使用成功的 entity ID
      },
      subsidiary: {
        id: "1"
      },
      trandate: "2025-11-09",
      memo: "測試費用報告 - 複製成功結構（測試 1）",
      accountingapproval: false,  // 成功的報告是 false
      supervisorapproval: false,  // 成功的報告是 false
      expense: {
        items: [
          {
            expensedate: "2025-11-09",
            category: {
              id: "7"  // Lunch
            },
            amount: 10,
            // 不包含 currency，因為 header 已經有 currency
            memo: "測試項目 - 測試 1"
          }
        ]
      }
    };

    // 測試 2: 包含 currency（雖然 header 已經有，但測試看看）
    const testPayload2 = {
      entity: {
        id: "15"
      },
      subsidiary: {
        id: "1"
      },
      trandate: "2025-11-09",
      memo: "測試費用報告 - 複製成功結構（測試 2，包含 item currency）",
      accountingapproval: false,
      supervisorapproval: false,
      expense: {
        items: [
          {
            expensedate: "2025-11-09",
            category: {
              id: "7"
            },
            amount: 10,
            currency: {
              id: "1"  // 包含 currency
            },
            memo: "測試項目 - 測試 2"
          }
        ]
      }
    };

    // 測試 3: 使用我們原本的結構（但使用成功的 entity 和 category）
    const testPayload3 = {
      entity: {
        id: "15"
      },
      subsidiary: {
        id: "1"
      },
      trandate: "2025-11-09",
      memo: "測試費用報告 - 使用原本結構（測試 3）",
      accountingapproval: true,
      supervisorapproval: true,
      expense: {
        items: [
          {
            expensedate: "2025-11-09",
            category: {
              id: "7"
            },
            amount: 10,
            currency: {
              id: "1"
            },
            memo: "測試項目 - 測試 3"
          }
        ]
      }
    };

    // 先測試包含 currency 的版本（測試 2），因為錯誤訊息顯示 expense item 必須有 currency
    const testPayload = testPayload2;

    console.log('========================================');
    console.log('測試 Payload（複製成功結構）:');
    console.log(JSON.stringify(testPayload, null, 2));
    console.log('========================================');

    try {
      const startTime = Date.now();
      // 呼叫 NetSuite API 建立 Expense Report
      const netsuiteResponse = await netsuite.createRecord('expenseReport', testPayload);
      const duration = Date.now() - startTime;
      
      console.log(`✅ NetSuite API 呼叫成功，耗時: ${duration}ms`);
      console.log('NetSuite 回應:', JSON.stringify(netsuiteResponse, null, 2));

      // 如果成功建立，查詢建立的記錄來驗證 expense items
      let expenseItemsCount = 0;
      let expenseItemsDetails: any = null;
      if (netsuiteResponse.id) {
        try {
          console.log(`查詢建立的 Expense Report (ID: ${netsuiteResponse.id}) 來驗證 expense items...`);
          const createdRecord = await netsuite.getRecord('expenseReport', netsuiteResponse.id);
          
          // 查詢 expense 子資源
          if (createdRecord.expense && createdRecord.expense.links) {
            const expenseLink = createdRecord.expense.links.find((link: any) => link.rel === 'self');
            if (expenseLink) {
              const expenseUrl = expenseLink.href;
              const expensePath = expenseUrl.replace('https://td3018275.suitetalk.api.netsuite.com', '');
              const expenseSubResource = await netsuite.request(expensePath, 'GET');
              
              if (expenseSubResource.items && Array.isArray(expenseSubResource.items)) {
                expenseItemsCount = expenseSubResource.items.length;
                console.log(`✅ Expense items 數量: ${expenseItemsCount}`);
                
                // 查詢每個 expense item 的詳細資訊
                const detailedItems = await Promise.all(
                  expenseSubResource.items.map(async (item: any) => {
                    if (item.links && item.links.length > 0) {
                      const itemLink = item.links.find((link: any) => link.rel === 'self');
                      if (itemLink) {
                        const itemUrl = itemLink.href;
                        const itemPath = itemUrl.replace('https://td3018275.suitetalk.api.netsuite.com', '');
                        const itemDetails = await netsuite.request(itemPath, 'GET');
                        return itemDetails;
                      }
                    }
                    return item;
                  })
                );
                
                expenseItemsDetails = detailedItems;
                console.log(`Expense items 詳情:`, JSON.stringify(expenseItemsDetails, null, 2));
              }
            }
          }
        } catch (queryError: any) {
          console.warn('無法查詢建立的記錄:', queryError.message);
        }
      }

      return NextResponse.json({
        success: true,
        message: '測試成功',
        duration: `${duration}ms`,
        netsuite_response: netsuiteResponse,
        expense_items_count: expenseItemsCount,
        expense_items_details: expenseItemsDetails,
        payload: testPayload,
        note: expenseItemsCount === 0 
          ? '⚠️ 警告：建立的 Expense Report 中沒有 expense items' 
          : `✅ 成功建立 ${expenseItemsCount} 個 expense items`,
      });

    } catch (netsuiteError: any) {
      console.error('❌ NetSuite API 錯誤:', netsuiteError);
      console.error('錯誤堆疊:', netsuiteError.stack);
      
      const errorMessage = netsuiteError.message || netsuiteError.toString() || '未知錯誤';
      const errorDetails = netsuiteError.response?.data || netsuiteError.body || netsuiteError.details || null;

      return NextResponse.json(
        {
          success: false,
          error: 'NetSuite API 測試失敗',
          message: errorMessage,
          details: errorDetails,
          payload: testPayload,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('測試 Expense Report Payload 錯誤:', error);
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

