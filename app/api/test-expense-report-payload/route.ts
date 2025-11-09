import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Expense Report Payload
 * 使用用戶提供的 Payroll 範例格式直接測試
 */
export async function POST(request: Request) {
  try {
    const netsuite = getNetSuiteAPIClient();

    // 測試 1: 使用用戶提供的 Payroll 範例格式（原始）
    const testPayload1 = {
      entity: {
        id: "1768"
      },
      subsidiary: {
        id: "10"
      },
      trandate: "2025-10-30",
      memo: "測試報支 - 使用 Payroll 範例格式（原始）",
      accountingapproval: true,
      supervisorapproval: true,
      expense: {
        items: [
          {
            expensedate: "2021-05-30",
            category: {
              id: "8"
            },
            amount: 315,
            currency: {
              id: "6"
            },
            memo: "測試報支項目"
          }
        ]
      }
    };

    // 測試 2: 使用實際報支資料的 ID（從資料庫查詢）
    const testPayload2 = {
      entity: {
        id: "-5"  // 實際的 employee_netsuite_id
      },
      subsidiary: {
        id: "1"  // 實際的 subsidiary_netsuite_id
      },
      trandate: "2025-11-09",
      memo: "測試報支 - 使用實際資料 ID",
      accountingapproval: true,
      supervisorapproval: true,
      expense: {
        items: [
          {
            expensedate: "2025-11-09",
            category: {
              id: "8"  // Taxi Fare
            },
            amount: 999,
            currency: {
              id: "9"  // 實際的 currency_netsuite_id
            },
            memo: "測試報支項目 - 使用實際資料"
          }
        ]
      }
    };

    // 測試 3: 嘗試不同的 expense items 結構（不使用 currency，因為 header 已經有 currency）
    const testPayload3 = {
      entity: {
        id: "-5"
      },
      subsidiary: {
        id: "1"
      },
      trandate: "2025-11-09",
      memo: "測試報支 - 測試 3（不使用 item currency）",
      accountingapproval: true,
      supervisorapproval: true,
      expense: {
        items: [
          {
            expensedate: "2025-11-09",
            category: {
              id: "8"
            },
            amount: 999,
            // 不包含 currency，因為 header 已經有 currency
            memo: "測試報支項目 - 測試 3"
          }
        ]
      }
    };

    // 測試 4: 嘗試使用 account 而不是 category（某些 NetSuite 設定可能需要 account）
    const testPayload4 = {
      entity: {
        id: "-5"
      },
      subsidiary: {
        id: "1"
      },
      trandate: "2025-11-09",
      memo: "測試報支 - 測試 4（使用 account）",
      accountingapproval: true,
      supervisorapproval: true,
      expense: {
        items: [
          {
            expensedate: "2025-11-09",
            category: {
              id: "8"
            },
            account: {
              id: "25"  // 從 NetSuite Field Explorer 看到 account:"25"
            },
            amount: 999,
            currency: {
              id: "9"
            },
            memo: "測試報支項目 - 測試 4"
          }
        ]
      }
    };

    // 測試 5: 嘗試不使用 expense.items，直接使用 expense（某些 API 可能需要這種格式）
    const testPayload5 = {
      entity: {
        id: "-5"
      },
      subsidiary: {
        id: "1"
      },
      trandate: "2025-11-09",
      memo: "測試報支 - 測試 5（直接使用 expense 陣列）",
      accountingapproval: true,
      supervisorapproval: true,
      expense: [
        {
          expensedate: "2025-11-09",
          category: {
            id: "8"
          },
          amount: 999,
          currency: {
            id: "9"
          },
          memo: "測試報支項目 - 測試 5"
        }
      ]
    };

    // 測試 6: 嘗試使用完整的 Payroll 範例格式（但使用實際的 ID）
    const testPayload6 = {
      entity: {
        id: "-5"
      },
      subsidiary: {
        id: "1"
      },
      trandate: "2025-11-09",
      memo: "測試報支 - 測試 6（完整 Payroll 格式）",
      accountingapproval: true,
      supervisorapproval: true,
      expense: {
        items: [
          {
            expensedate: "2025-11-09",
            category: {
              id: "8"
            },
            amount: 999,
            currency: {
              id: "9"
            },
            memo: "測試報支項目 - 測試 6"
          }
        ]
      }
    };

    // 測試 7: 根據 NetSuite Field Explorer，可能需要使用 account 欄位（從 expense category 取得對應的 account）
    // 從 NetSuite Field Explorer 看到 account:"25"，測試使用 account 欄位
    const testPayload7 = {
      entity: {
        id: "-5"
      },
      subsidiary: {
        id: "1"
      },
      trandate: "2025-11-09",
      memo: "測試報支 - 測試 7（使用 account 欄位）",
      accountingapproval: true,
      supervisorapproval: true,
      expense: {
        items: [
          {
            expensedate: "2025-11-09",
            category: {
              id: "8"
            },
            account: {
              id: "25"  // 從 NetSuite Field Explorer 看到 account:"25"
            },
            amount: 999,
            currency: {
              id: "9"
            },
            memo: "測試報支項目 - 測試 7（使用 account）"
          }
        ]
      }
    };

    // 先測試實際報支資料（因為 Payroll 範例的 ID 可能不適用於當前 NetSuite 環境）
    // 測試不同的 payload 結構來找出問題
    // 根據 NetSuite Field Explorer，可能需要使用 account 而不是 category
    // 先測試 Payroll 範例格式（testPayload6），因為這是用戶提供的成功範例
    // 但根據用戶回報，expense items 沒有被建立，所以嘗試不同的格式
    // 根據 NetSuite Field Explorer 看到 account:"25"，測試使用 account 欄位
    const testPayload = testPayload7; // 測試使用 account 欄位

    console.log('========================================');
    console.log('測試 Payload（使用 Payroll 範例格式）:');
    console.log(JSON.stringify(testPayload, null, 2));
    console.log('========================================');

    try {
      const startTime = Date.now();
      // 呼叫 NetSuite API 建立 Expense Report
      const netsuiteResponse = await netsuite.createRecord('expenseReport', testPayload);
      const duration = Date.now() - startTime;
      
      console.log(`✅ NetSuite API 呼叫成功，耗時: ${duration}ms`);
      console.log('NetSuite 回應:', JSON.stringify(netsuiteResponse, null, 2));

      // 如果成功建立，嘗試查詢建立的記錄來驗證 expense items
      let expenseItemsCount = 0;
      let expenseItemsDetails: any = null;
      if (netsuiteResponse.id) {
        try {
          console.log(`嘗試查詢建立的 Expense Report (ID: ${netsuiteResponse.id}) 來驗證 expense items...`);
          const createdRecord = await netsuite.getRecord('expenseReport', netsuiteResponse.id);
          console.log('建立的記錄:', JSON.stringify(createdRecord, null, 2));
          
          // 檢查 expense items（NetSuite REST API 可能使用不同的結構）
          console.log('建立的記錄完整結構:', JSON.stringify(createdRecord, null, 2));
          console.log('建立的記錄所有鍵:', Object.keys(createdRecord));
          
          // 嘗試不同的可能結構
          if (createdRecord.expense) {
            if (Array.isArray(createdRecord.expense)) {
              expenseItemsCount = createdRecord.expense.length;
              expenseItemsDetails = createdRecord.expense;
              console.log(`✅ Expense items 數量（陣列格式）: ${expenseItemsCount}`);
            } else if (createdRecord.expense.items && Array.isArray(createdRecord.expense.items)) {
              expenseItemsCount = createdRecord.expense.items.length;
              expenseItemsDetails = createdRecord.expense.items;
              console.log(`✅ Expense items 數量（items 格式）: ${expenseItemsCount}`);
            } else {
              console.warn('⚠️ expense 物件存在但不是陣列或沒有 items 陣列');
              console.warn('expense 物件結構:', JSON.stringify(createdRecord.expense, null, 2));
            }
          } else {
            console.warn('⚠️ 建立的記錄中沒有 expense 欄位');
            console.warn('建立的記錄所有鍵:', Object.keys(createdRecord));
            
            // 檢查是否有其他可能的欄位名稱
            const possibleFields = ['expenses', 'expenseItems', 'lineItems', 'items'];
            for (const field of possibleFields) {
              if (createdRecord[field]) {
                console.log(`發現可能的 expense items 欄位: ${field}`, createdRecord[field]);
              }
            }
          }
          
          if (expenseItemsDetails) {
            console.log(`Expense items 詳情:`, JSON.stringify(expenseItemsDetails, null, 2));
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
        note: expenseItemsCount === 0 ? '⚠️ 警告：建立的 Expense Report 中沒有 expense items，請檢查 payload 結構' : '✅ Expense items 已正確建立',
      });

    } catch (netsuiteError: any) {
      console.error('❌ NetSuite API 錯誤:', netsuiteError);
      console.error('錯誤堆疊:', netsuiteError.stack);
      
      const errorMessage = netsuiteError.message || netsuiteError.toString() || '未知錯誤';
      const errorDetails = netsuiteError.response?.data || netsuiteError.body || netsuiteError.details || null;

      // 嘗試從錯誤中提取更多資訊
      let fullErrorDetails = {
        message: errorMessage,
        details: errorDetails,
        name: netsuiteError.name,
        stack: netsuiteError.stack,
      };

      return NextResponse.json(
        {
          success: false,
          error: 'NetSuite API 測試失敗',
          message: errorMessage,
          details: fullErrorDetails,
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

