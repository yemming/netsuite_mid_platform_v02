import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

// 已知的交易類型映射（NetSuite 標準交易類型）
const TRANSACTION_TYPES: Record<string, string> = {
  'salesorder': 'SalesOrd',
  'purchaseorder': 'PurchOrd',
  'invoice': 'CustInvc',
  'vendorbill': 'VendBill',
  'estimate': 'Estimate',
  'cashsale': 'CashSale',
  'customersale': 'CustSale',
  'purchaseorderitem': 'PurchOrdItem',
  'transaction': 'Transaction',
};

// 主檔類型（通常是直接對應表格名稱的）
const MASTER_RECORD_TYPES = [
  'customer',
  'vendor',
  'item',
  'inventoryitem',
  'currency',
  'subsidiary',
  'department',
  'location',
  'classification',
  'employee',
  'contact',
  'account',
  'taxitem',
];

// 判斷 record type 對應的 SuiteQL 表格
function getSuiteQLTable(recordType: string): {
  suiteqlTable: string;
  category: 'master' | 'transaction' | 'custom';
  transactionType?: string;
  isAvailable: boolean;
} {
  const lowerRecordType = recordType.toLowerCase();
  
  // 檢查是否為交易類型
  if (TRANSACTION_TYPES[lowerRecordType]) {
    return {
      suiteqlTable: 'transaction',
      category: 'transaction',
      transactionType: TRANSACTION_TYPES[lowerRecordType],
      isAvailable: true,
    };
  }
  
  // 檢查是否為主檔類型
  if (MASTER_RECORD_TYPES.includes(lowerRecordType)) {
    // 特殊處理：inventoryitem -> item
    const tableName = lowerRecordType === 'inventoryitem' ? 'item' : lowerRecordType;
    return {
      suiteqlTable: tableName,
      category: 'master',
      isAvailable: true,
    };
  }
  
  // 其他類型：嘗試直接使用 record type 作為表格名稱
  // 但標記為 custom，並需要驗證是否可用
  return {
    suiteqlTable: lowerRecordType,
    category: 'custom',
    isAvailable: false, // 需要後續驗證
  };
}

// 驗證 SuiteQL 表格是否存在（嘗試查詢記錄數）
async function validateSuiteQLTable(
  netsuite: ReturnType<typeof getNetSuiteAPIClient>,
  tableName: string
): Promise<{ isValid: boolean; recordCount?: number }> {
  try {
    // 嘗試執行簡單的查詢來驗證表格是否存在
    // COUNT(*) 查詢只會返回一行，不需要 FETCH FIRST
    const result = await netsuite.executeSuiteQL(
      `SELECT COUNT(*) as count FROM ${tableName}`,
      { fetchAll: false }
    );
    
    if (result.items && result.items.length > 0) {
      const count = result.items[0].count || 0;
      return { isValid: true, recordCount: typeof count === 'number' ? count : parseInt(String(count), 10) };
    }
    
    return { isValid: true, recordCount: 0 };
  } catch (error) {
    // 如果查詢失敗，表格可能不存在或無權限訪問
    return { isValid: false };
  }
}

export async function POST() {
  try {
    // 驗證 NetSuite 環境變數
    const requiredEnvVars = [
      'NETSUITE_ACCOUNT_ID',
      'NETSUITE_CONSUMER_KEY',
      'NETSUITE_CONSUMER_SECRET',
      'NETSUITE_TOKEN_ID',
      'NETSUITE_TOKEN_SECRET',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      return NextResponse.json(
        { 
          error: `NetSuite 環境變數未設定: ${missingVars.join(', ')}` 
        },
        { status: 500 }
      );
    }

    const netsuite = getNetSuiteAPIClient();
    const supabase = await createClient();

    // 1. 從 NetSuite 獲取 metadata-catalog
    console.log('正在從 NetSuite 獲取 metadata-catalog...');
    const catalog = await netsuite.getMetadataCatalog();
    
    if (!catalog.items || catalog.items.length === 0) {
      return NextResponse.json(
        { error: '無法從 NetSuite 獲取 metadata-catalog 資料' },
        { status: 500 }
      );
    }

    console.log(`獲取到 ${catalog.items.length} 個 record types`);

    // 2. 處理每個 record type
    const recordsToInsert: any[] = [];
    const categories = {
      master: 0,
      transaction: 0,
      custom: 0,
    };
    
    let subscribedCount = 0;
    let calculatedCount = 0;
    let errorCount = 0;

    // 先獲取現有的訂閱狀態，以便在同步時保留
    const { data: existingRecords } = await supabase
      .from('suiteql_tables_reference')
      .select('record_type, is_subscribed');
    
    const subscriptionMap = new Map<string, boolean>();
    if (existingRecords) {
      existingRecords.forEach((record: any) => {
        subscriptionMap.set(record.record_type, record.is_subscribed || false);
      });
    }

    // 處理所有 record types（分批處理以避免過載）
    for (let i = 0; i < catalog.items.length; i++) {
      const item = catalog.items[i];
      const recordType = item.name;
      
      try {
        const mapping = getSuiteQLTable(recordType);
        let recordCount: number | null = null;
        let isAvailable = mapping.isAvailable;

        // 如果是自定義類型或需要驗證，嘗試驗證表格
        if (mapping.category === 'custom' || !mapping.isAvailable) {
          const validation = await validateSuiteQLTable(netsuite, mapping.suiteqlTable);
          isAvailable = validation.isValid;
          if (validation.isValid && validation.recordCount !== undefined) {
            recordCount = validation.recordCount;
            calculatedCount++;
          } else {
            errorCount++;
          }
        } else if (mapping.category === 'master' || mapping.category === 'transaction') {
          // 對於已知的主檔和交易類型，嘗試獲取記錄數
          try {
            const validation = await validateSuiteQLTable(netsuite, mapping.suiteqlTable);
            if (validation.isValid && validation.recordCount !== undefined) {
              recordCount = validation.recordCount;
              calculatedCount++;
            }
          } catch (err) {
            // 忽略錯誤，繼續處理
            console.warn(`無法獲取 ${recordType} 的記錄數:`, err);
            errorCount++;
          }
        }

        // 保留現有的訂閱狀態
        const isSubscribed = subscriptionMap.get(recordType) || false;
        if (isSubscribed) {
          subscribedCount++;
        }

        recordsToInsert.push({
          record_type: recordType,
          suiteql_table: mapping.suiteqlTable,
          category: mapping.category,
          transaction_type: mapping.transactionType || null,
          is_available: isAvailable,
          record_count: recordCount,
          is_subscribed: isSubscribed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        categories[mapping.category]++;

        // 每 50 個記錄輸出一次進度
        if ((i + 1) % 50 === 0) {
          console.log(`已處理 ${i + 1}/${catalog.items.length} 個 record types...`);
        }
      } catch (error: any) {
        console.error(`處理 record type ${recordType} 時發生錯誤:`, error);
        errorCount++;
        
        // 即使出錯也插入記錄，標記為不可用
        recordsToInsert.push({
          record_type: recordType,
          suiteql_table: 'unknown',
          category: 'custom',
          transaction_type: null,
          is_available: false,
          record_count: null,
          is_subscribed: subscriptionMap.get(recordType) || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        categories.custom++;
      }
    }

    // 3. 使用 upsert 更新資料庫（保留現有的訂閱狀態）
    console.log('正在更新 Supabase 資料庫...');
    
    // 分批 upsert 資料以提高效能
    const batchSize = 100;
    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize);
      
      // 使用 upsert，根據 record_type 進行衝突處理
      // 這樣可以保留現有的訂閱狀態（is_subscribed）
      const { error: upsertError } = await supabase
        .from('suiteql_tables_reference')
        .upsert(batch, {
          onConflict: 'record_type',
          // 只有在 is_subscribed 為 false 時才更新它（保留現有的訂閱）
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error(`Upsert 批次 ${Math.floor(i / batchSize) + 1} 時發生錯誤:`, upsertError);
        
        // 如果批次 upsert 失敗，嘗試單筆處理
        for (const record of batch) {
          // 先檢查是否已存在，如果存在則保留 is_subscribed
          const { data: existing } = await supabase
            .from('suiteql_tables_reference')
            .select('is_subscribed')
            .eq('record_type', record.record_type)
            .single();
          
          // 如果存在且已有訂閱，保留訂閱狀態
          if (existing && existing.is_subscribed) {
            record.is_subscribed = true;
          }
          
          const { error: singleError } = await supabase
            .from('suiteql_tables_reference')
            .upsert([record], { onConflict: 'record_type' });
          
          if (singleError) {
            console.error(`無法 upsert record type ${record.record_type}:`, singleError);
          }
        }
      }
    }

    // 4. 更新同步資訊
    const availableTables = recordsToInsert.filter(r => r.is_available).length;
    const syncTime = new Date().toISOString();
    
    // 先檢查是否存在記錄
    const { data: existingSyncInfo } = await supabase
      .from('suiteql_metadata_sync_info')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    const syncInfoData = {
      last_sync_at: syncTime,
      available_tables: availableTables,
      total_record_types: recordsToInsert.length,
      updated_at: syncTime,
    };
    
    let syncInfoError;
    if (existingSyncInfo && existingSyncInfo.id) {
      // 如果存在記錄，使用更新
      const { error } = await supabase
        .from('suiteql_metadata_sync_info')
        .update(syncInfoData)
        .eq('id', existingSyncInfo.id);
      syncInfoError = error;
    } else {
      // 如果不存在，使用插入（不指定 id，讓資料庫自動生成）
      const { error } = await supabase
        .from('suiteql_metadata_sync_info')
        .insert(syncInfoData);
      syncInfoError = error;
      
      // 如果插入失敗（可能是因為 id 欄位必需），嘗試使用 upsert
      if (syncInfoError) {
        console.warn('插入同步資訊失敗，嘗試使用 upsert:', syncInfoError);
        const { error: upsertError } = await supabase
          .from('suiteql_metadata_sync_info')
          .upsert({
            id: 1,
            ...syncInfoData,
          }, {
            onConflict: 'id',
          });
        syncInfoError = upsertError;
      }
    }

    if (syncInfoError) {
      console.error('更新同步資訊失敗:', syncInfoError);
    } else {
      console.log('同步資訊已更新:', { last_sync_at: syncTime, available_tables: availableTables });
    }

    console.log('同步完成！');

    return NextResponse.json({
      message: 'Meta Record 同步成功',
      syncedCount: recordsToInsert.length,
      categories,
      subscribedCount,
      calculatedCount,
      errorCount,
      availableTables,
    });
  } catch (error: any) {
    console.error('同步 metadata 錯誤:', error);
    return NextResponse.json(
      { 
        error: error.message || '同步 metadata 時發生未知錯誤',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

