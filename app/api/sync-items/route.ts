import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';
import { createClient } from '@/utils/supabase/server';

/**
 * 同步 Items（產品主檔）
 * ⚠️ 注意：NetSuite SuiteQL 不支援 item 表的價格欄位（baseprice），使用 REST API
 */
export async function POST() {
  try {
    const startTime = Date.now();
    const netsuite = getNetSuiteAPIClient();
    const supabase = await createClient();

    console.log('開始從 NetSuite 查詢 Item 資料...');
    console.log('⚠️ 使用混合方式：SuiteQL 查詢所有 items，REST API 查詢詳細資訊（含價格）');

    // ⚠️ 重要：REST API 的 record type 映射不完整，無法查詢到所有 items
    // 解決方案：先用 SuiteQL 查詢所有 items，再用 REST API 查詢每個 item 的詳細資訊
    // 步驟 1: 使用 SuiteQL 查詢所有 items（確保取得所有 95 筆）
    console.log('步驟 1: 使用 SuiteQL 查詢所有 items...');
    const suiteqlResult = await netsuite.executeSuiteQL(`
      SELECT id, itemid, displayname, itemtype, isinactive
      FROM item
      ORDER BY id
    `);

    const suiteqlItems = suiteqlResult.items || [];
    console.log(`SuiteQL 查詢到 ${suiteqlItems.length} 筆 items`);

    if (suiteqlItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '無資料',
          message: 'NetSuite 中沒有找到任何 Item 資料',
        },
        { status: 404 }
      );
    }

    // 步驟 2: 根據 itemtype 映射到 REST API record type
    // NetSuite itemtype → REST API record type 映射
    const itemTypeMapping: Record<string, string> = {
      'InvtPart': 'inventoryitem',
      'NonInvtPart': 'noninventoryresaleitem', // 可能需要其他類型
      'Service': 'serviceresaleitem',
      'Assembly': 'assemblyitem',
      'GiftCert': 'giftcertificateitem',
      'Markup': 'markupitem',
      'Discount': 'discountitem',
      'Group': 'kititem',
      'Kit': 'kititem',
      'DownloadItem': 'downloaditem',
      'PaymentItem': 'paymentitem',
    };

    // 步驟 3: 使用 REST API 查詢每個 item 的詳細資訊（含價格）
    console.log('步驟 2: 使用 REST API 查詢每個 item 的詳細資訊...');
    const allItems: any[] = [];

    // 批次查詢 items（每批 10 個，避免 API 限制）
    const batchSize = 10;
    for (let i = 0; i < suiteqlItems.length; i += batchSize) {
      const batch = suiteqlItems.slice(i, i + batchSize);
      console.log(`處理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(suiteqlItems.length / batchSize)} (items ${i + 1}-${Math.min(i + batchSize, suiteqlItems.length)})...`);
      
      // 並行查詢批次中的每個 item
      const batchPromises = batch.map(async (suiteqlItem: any) => {
        const itemId = suiteqlItem.id;
        const itemType = suiteqlItem.itemtype;
        const restRecordType = itemTypeMapping[itemType] || 'inventoryitem'; // 預設使用 inventoryitem
        
        try {
          // 使用 REST API 查詢單一 item 的詳細資訊
          const itemDetail = await netsuite.getRecord(restRecordType, itemId);
          
          // 如果查不到，嘗試其他可能的 record type
          if (!itemDetail || !itemDetail.id) {
            // 嘗試其他可能的 record type
            const alternativeTypes = [
              'inventoryitem',
              'noninventoryresaleitem',
              'serviceresaleitem',
              'assemblyitem',
              'giftcertificateitem',
              'markupitem',
              'discountitem',
              'kititem',
            ];
            
            for (const altType of alternativeTypes) {
              if (altType === restRecordType) continue; // 跳過已嘗試的類型
              
              try {
                const altItemDetail = await netsuite.getRecord(altType, itemId);
                if (altItemDetail && altItemDetail.id) {
                  return {
                    ...altItemDetail,
                    _itemType: altType,
                    _suiteqlItemType: itemType,
                  };
                }
              } catch {
                // 繼續嘗試下一個類型
              }
            }
            
            // 如果所有類型都查不到，使用 SuiteQL 的資料
            console.warn(`無法從 REST API 取得 item ${itemId} (${itemType}) 的詳細資訊，使用 SuiteQL 資料`);
            return {
              id: itemId,
              itemId: suiteqlItem.itemid,
              displayName: suiteqlItem.displayname,
              itemType: itemType,
              isInactive: suiteqlItem.isinactive === 'T',
              _itemType: restRecordType,
              _suiteqlItemType: itemType,
              _fromSuiteQL: true, // 標記為來自 SuiteQL
            };
          }
          
          return {
            ...itemDetail,
            _itemType: restRecordType,
            _suiteqlItemType: itemType,
          };
        } catch (error: any) {
          const errorMessage = error.message || error.toString() || '未知錯誤';
          console.warn(`查詢 item ${itemId} (${itemType}) 失敗:`, errorMessage);
          
          // 如果 REST API 查詢失敗，使用 SuiteQL 的資料
          return {
            id: itemId,
            itemId: suiteqlItem.itemid,
            displayName: suiteqlItem.displayname,
            itemType: itemType,
            isInactive: suiteqlItem.isinactive === 'T',
            _itemType: restRecordType,
            _suiteqlItemType: itemType,
            _fromSuiteQL: true, // 標記為來自 SuiteQL
            _error: errorMessage,
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      allItems.push(...batchResults);
      
      // 每批次之間稍作延遲，避免 API 限制
      if (i + batchSize < suiteqlItems.length) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 延遲 100ms
      }
    }
    
    console.log(`從 REST API 取得總共 ${allItems.length} 筆 Item 詳細資料`);
    
    // 檢查是否有錯誤
    const itemsWithErrors = allItems.filter(item => item._error);
    if (itemsWithErrors.length > 0) {
      console.warn(`${itemsWithErrors.length} 筆 items 無法從 REST API 取得詳細資訊，使用 SuiteQL 資料`);
    }
    
    // 舊的查詢邏輯（已移除，改用混合方式）
    /*
    for (const itemType of itemTypes) {
      try {
        console.log(`查詢 ${itemType}（使用 List API 分頁查詢）...`);
        
        // 使用 List API 並手動處理分頁
        const allItemsForType: any[] = [];
        let offset = 0;
        const limit = 100; // 使用較小的 limit 確保分頁正常
        let hasMore = true;
        let pageCount = 0;
        let consecutiveEmptyPages = 0; // 連續空頁計數，避免無限循環

        while (hasMore && consecutiveEmptyPages < 3 && pageCount < 50) { // 最多查詢 50 頁，避免無限循環
          pageCount++;
          console.log(`查詢 ${itemType} 第 ${pageCount} 頁（offset: ${offset}, limit: ${limit}）...`);
          
          try {
            const pageResult = await netsuite.getRecordList(itemType, {
              fetchAll: false,
              limit: limit,
              offset: offset,
            });

            if (pageResult.items && pageResult.items.length > 0) {
              allItemsForType.push(...pageResult.items);
              offset += pageResult.items.length;
              hasMore = pageResult.hasMore || false;
              consecutiveEmptyPages = 0; // 重置計數
              console.log(`第 ${pageCount} 頁取得 ${pageResult.items.length} 筆，累計 ${allItemsForType.length} 筆，hasMore: ${hasMore}`);
              
              // ⚠️ 重要：NetSuite List API 的 hasMore 可能不準確
              // 如果取得的資料量等於 limit，即使 hasMore=false，也可能還有更多資料
              // 繼續查詢下一頁確認（最多再查 2 頁）
              if (!hasMore && pageResult.items.length === limit) {
                console.log(`警告：第 ${pageCount} 頁取得 ${limit} 筆但 hasMore=false，繼續查詢下一頁確認...`);
                hasMore = true; // 強制繼續查詢
                consecutiveEmptyPages = -1; // 允許再查一頁
              }
            } else {
              consecutiveEmptyPages++;
              if (consecutiveEmptyPages >= 2) {
                hasMore = false;
                console.log(`連續 ${consecutiveEmptyPages} 頁無資料，停止查詢`);
              }
            }
          } catch (pageError: any) {
            // 如果查詢失敗（例如 offset 超出範圍），停止查詢
            const errorMessage = pageError.message || pageError.toString() || '';
            console.warn(`查詢 ${itemType} 第 ${pageCount} 頁失敗:`, errorMessage);
            
            // 如果是 400 或 404 錯誤（offset 超出範圍），停止查詢
            if (errorMessage.includes('400') || errorMessage.includes('404') || errorMessage.includes('out of range')) {
              hasMore = false;
              break;
            }
            // 其他錯誤，嘗試繼續
            consecutiveEmptyPages++;
            if (consecutiveEmptyPages >= 2) {
              hasMore = false;
            }
          }
        }

        const result = {
          items: allItemsForType,
          count: allItemsForType.length,
          hasMore: false,
        };
        
        console.log(`完成查詢 ${itemType}，總共取得 ${result.items.length} 筆`);

        if (result.items && result.items.length > 0) {
          // 為每個 item 標記類型
          const typedItems = result.items.map((item: any) => ({
            ...item,
            _itemType: itemType,
          }));
          allItems.push(...typedItems);
          console.log(`取得 ${typedItems.length} 筆 ${itemType}`);
        }
      } catch (error: any) {
        const errorMessage = error.message || error.toString() || '未知錯誤';
        console.warn(`查詢 ${itemType} 失敗:`, errorMessage);
        
        // 如果錯誤訊息是 HTML，提取關鍵資訊
        if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('<html')) {
          errors.push(`${itemType}: NetSuite API 返回 HTML 錯誤頁面（可能是權限問題或端點不存在）`);
        } else {
          errors.push(`${itemType}: ${errorMessage}`);
        }
        // 繼續查詢其他類型，不中斷整個流程
      }
    }
    
    // 如果有錯誤，記錄但不中斷
    if (errors.length > 0) {
      console.warn('部分 Item 類型查詢失敗:', errors);
    }
    */

    console.log(`從 NetSuite 取得總共 ${allItems.length} 筆 Item 資料`);

    if (allItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '無資料',
          message: 'NetSuite 中沒有找到任何 Item 資料',
        },
        { status: 404 }
      );
    }

    // 轉換資料格式
    const syncTimestamp = new Date().toISOString();
    const recordsToUpsert = allItems.map((item: any) => {
      // REST API 返回的資料結構
      const itemId = item.itemId || item.itemid || '';
      const displayName = item.displayName || item.displayname || item.name || '';
      const fullName = item.fullName || item.fullname || displayName;
      // 優先使用 SuiteQL 的 itemtype，因為它更準確
      const itemType = item._suiteqlItemType || item.itemType || item.itemtype || item._itemType || '';
      const description = item.description || null;
      const salesDescription = item.salesDescription || item.salesdescription || null;
      const purchaseDescription = item.purchaseDescription || item.purchasedescription || null;
      
      // 價格資訊（REST API 中可能有 basePrice 或 price）
      const basePrice = item.basePrice || item.baseprice || item.price || null;
      
      // 會計科目（從物件中取得 ID）
      const incomeAccountId = item.incomeAccount?.id ? parseInt(item.incomeAccount.id) : 
                              (item.incomeaccount ? parseInt(item.incomeaccount) : null);
      const expenseAccountId = item.expenseAccount?.id ? parseInt(item.expenseAccount.id) : 
                               (item.expenseaccount ? parseInt(item.expenseaccount) : null);
      const assetAccountId = item.assetAccount?.id ? parseInt(item.assetAccount.id) : 
                            (item.assetaccount ? parseInt(item.assetaccount) : null);
      
      // 注意：ns_items 表中沒有 costing_method 欄位
      
      // 是否為組合品
      const isAssembly = itemType === 'assemblyitem' || itemType === 'Assembly Item' || false;
      
      // 是否停用
      const isInactive = item.isInactive === true || item.isinactive === 'T' || false;

      return {
        netsuite_internal_id: parseInt(item.id), // REST API 返回的 id 是字串，需轉換
        item_id: itemId,
        name: displayName,
        display_name: displayName,
        // 注意：ns_items 表中沒有 full_name 欄位
        item_type: itemType,
        description: description,
        sales_description: salesDescription,
        purchase_description: purchaseDescription,
        base_price: basePrice ? parseFloat(basePrice) : null,
        income_account_id: incomeAccountId,
        expense_account_id: expenseAccountId,
        asset_account_id: assetAccountId,
        // 注意：ns_items 表中沒有 costing_method 欄位
        is_assembly: isAssembly,
        is_inactive: isInactive,
        sync_timestamp: syncTimestamp,
        updated_at: syncTimestamp,
      };
    });

    console.log(`準備 Upsert ${recordsToUpsert.length} 筆記錄到 Supabase...`);

    // 執行 Upsert
    const { data: upsertedData, error: upsertError } = await supabase
      .from('ns_items')
      .upsert(recordsToUpsert, {
        onConflict: 'netsuite_internal_id',
        ignoreDuplicates: false,
      })
      .select();

    if (upsertError) {
      console.error('Items Upsert 錯誤:', upsertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase 寫入失敗',
          message: upsertError.message || '無法寫入資料到 Supabase',
          details: upsertError,
        },
        { status: 500 }
      );
    }

    const timeTaken = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `成功同步 ${upsertedData?.length || 0} 筆 ns_items 資料`,
      data: {
        totalRecords: allItems.length,
        upsertedRecords: upsertedData?.length || 0,
        timeTaken: `${timeTaken}ms`,
      },
    });
  } catch (error: any) {
    console.error('同步 Items 錯誤:', error);
    
    // 處理 HTML 錯誤回應
    let errorMessage = error.message || error.toString() || '同步 Items 時發生錯誤';
    if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('<html')) {
      errorMessage = 'NetSuite API 返回 HTML 錯誤頁面。可能原因：1) REST Web 服務權限未開啟 2) Item 類型端點不存在 3) 認證失敗。請檢查 NetSuite 權限設定。';
    }
    
    return NextResponse.json(
      {
        success: false,
        error: '同步失敗',
        message: errorMessage,
        details: errorMessage.includes('<!DOCTYPE') ? 'HTML 錯誤回應（已過濾）' : error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { getTableSyncStatus } = await import('@/lib/sync-utils');
  const status = await getTableSyncStatus('ns_items');
  return NextResponse.json(status);
}

