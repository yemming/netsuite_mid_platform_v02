import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';
import { createClient } from '@/utils/supabase/server';

/**
 * 掃描 NetSuite 中所有可用的表
 * 
 * 流程：
 * 1. 使用 Metadata API 取得所有 record types
 * 2. 使用 SuiteQL 驗證哪些表可以查詢
 * 3. 自動更新 table_mapping_config 表
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const supabase = await createClient();

    console.log('🔍 開始掃描 NetSuite 所有可用的表...');

    // 1. 取得 Metadata Catalog（所有可用的 record types）
    let metadataCatalog;
    try {
      metadataCatalog = await netsuite.getMetadataCatalog();
      console.log(`📋 從 Metadata API 找到 ${metadataCatalog.items?.length || 0} 個 record types`);
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: '無法取得 Metadata Catalog',
          message: error.message || 'NetSuite Metadata API 連線失敗',
        },
        { status: 500 }
      );
    }

    if (!metadataCatalog.items || metadataCatalog.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '沒有找到任何 record types',
        },
        { status: 404 }
      );
    }

    // 2. 對每個 record type，嘗試用 SuiteQL 驗證是否可用
    const scannedTables: Array<{
      recordType: string;
      suiteqlTable: string;
      label: string;
      recordCount: number;
      isValid: boolean;
      category: 'master' | 'transaction' | 'custom';
      transactionType?: string;
    }> = [];

    const errors: Array<{ recordType: string; error: string }> = [];

    // 已知的交易類型映射
    const TRANSACTION_TYPES: Record<string, string> = {
      'salesorder': 'SalesOrd',
      'purchaseorder': 'PurchOrd',
      'invoice': 'CustInvc',
      'vendorbill': 'VendBill',
      'estimate': 'Estimate',
      'cashsale': 'CashSale',
    };

    // 已知的主檔類型（直接對應 SuiteQL 表名）
    const MASTER_RECORD_MAPPING: Record<string, string> = {
      'inventoryitem': 'item',
      'taxitem': 'salestaxitem',
      'classification': 'classification',
      'customer': 'customer',
      'vendor': 'vendor',
      'employee': 'employee',
      'subsidiary': 'subsidiary',
      'currency': 'currency',
      'department': 'department',
      'location': 'location',
      'account': 'account',
      'term': 'term',
      'expensecategory': 'expensecategory',
      'shipitem': 'shipitem',
      'bom': 'bom',
      'workcenter': 'workcenter',
    };

    // 處理每個 record type
    for (const item of metadataCatalog.items) {
      const recordType = item.name?.toLowerCase() || '';
      if (!recordType) continue;

      try {
        // 判斷 SuiteQL 表名和類別
        let suiteqlTable: string;
        let category: 'master' | 'transaction' | 'custom' = 'custom';
        let transactionType: string | undefined;

        // 檢查是否為交易類型
        if (TRANSACTION_TYPES[recordType]) {
          suiteqlTable = 'transaction';
          category = 'transaction';
          transactionType = TRANSACTION_TYPES[recordType];
        }
        // 檢查是否為已知的主檔類型
        else if (MASTER_RECORD_MAPPING[recordType]) {
          suiteqlTable = MASTER_RECORD_MAPPING[recordType];
          category = 'master';
        }
        // 其他類型：嘗試直接使用 record type 作為表名
        else {
          suiteqlTable = recordType;
          category = 'custom';
        }

        // 嘗試用 SuiteQL 驗證表是否存在並取得記錄數
        let recordCount = 0;
        let isValid = false;

        try {
          let query = `SELECT COUNT(*) as count FROM ${suiteqlTable}`;
          
          // 如果是交易類型，需要加上 WHERE 條件
          if (category === 'transaction' && transactionType) {
            query = `SELECT COUNT(*) as count FROM ${suiteqlTable} WHERE type = '${transactionType}'`;
          }

          const result = await netsuite.executeSuiteQL(query, { fetchAll: false });
          
          if (result.items && result.items.length > 0) {
            const count = result.items[0].count;
            recordCount = typeof count === 'number' ? count : parseInt(String(count), 10) || 0;
            isValid = true;
          }
        } catch (suiteqlError: any) {
          // SuiteQL 查詢失敗，表可能不存在或無權限
          isValid = false;
          errors.push({
            recordType,
            error: `SuiteQL 驗證失敗: ${suiteqlError.message?.substring(0, 100) || '未知錯誤'}`,
          });
        }

        if (isValid) {
          // 生成中文標籤（從 record type 名稱推斷）
          const label = generateLabel(recordType);

          scannedTables.push({
            recordType,
            suiteqlTable,
            label,
            recordCount,
            isValid: true,
            category,
            transactionType,
          });
        }
      } catch (error: any) {
        errors.push({
          recordType,
          error: error.message?.substring(0, 100) || '處理失敗',
        });
      }
    }

    console.log(`✅ 成功掃描 ${scannedTables.length} 個可用的表`);

    // 3. 更新 table_mapping_config 表
    const upsertResults = {
      created: 0,
      updated: 0,
      errors: [] as Array<{ recordType: string; error: string }>,
    };

    for (const table of scannedTables) {
      try {
        // 生成 mapping_key（從 recordType 轉換）
        const mappingKey = generateMappingKey(table.recordType);
        
        // 生成 supabase_table_name（加上 ns_ 前綴）
        const supabaseTableName = `ns_${mappingKey}`;

        // 生成 API route
        const apiRoute = `/api/sync-${mappingKey}`;

        // 判斷優先級
        const priority = getPriority(table.category, table.recordType);

        // 判斷衝突欄位（通常是 netsuite_internal_id）
        const conflictColumn = 'netsuite_internal_id';

        // 判斷依賴關係（暫時為空，後續可以根據業務邏輯補充）
        const dependsOn: string[] = [];

        // 判斷同步順序（根據類別和優先級）
        const syncOrder = getSyncOrder(table.category, priority, table.recordType);

        // 判斷是否啟用（預設啟用主檔和已知的交易類型）
        const isEnabled = table.category === 'master' || 
                       (table.category === 'transaction' && table.transactionType) ||
                       table.recordCount > 0;

        // Upsert 到 table_mapping_config
        const { data, error } = await supabase
          .from('table_mapping_config')
          .upsert(
            {
              mapping_key: mappingKey,
              netsuite_table: table.suiteqlTable,
              supabase_table_name: supabaseTableName,
              label: table.label,
              priority,
              api_route: apiRoute,
              conflict_column: conflictColumn,
              depends_on: dependsOn,
              sync_order: syncOrder,
              is_enabled: isEnabled,
              disabled_reason: isEnabled ? null : '需要手動驗證',
            },
            {
              onConflict: 'mapping_key',
            }
          )
          .select();

        if (error) {
          upsertResults.errors.push({
            recordType: table.recordType,
            error: error.message,
          });
        } else {
          // 檢查是新增還是更新
          const existing = await supabase
            .from('table_mapping_config')
            .select('id')
            .eq('mapping_key', mappingKey)
            .single();

          if (existing.data) {
            upsertResults.updated++;
          } else {
            upsertResults.created++;
          }
        }
      } catch (error: any) {
        upsertResults.errors.push({
          recordType: table.recordType,
          error: error.message?.substring(0, 100) || '更新失敗',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功掃描 ${scannedTables.length} 個可用的表`,
      data: {
        totalScanned: metadataCatalog.items.length,
        validTables: scannedTables.length,
        invalidTables: errors.length,
        upsertResults: {
          created: upsertResults.created,
          updated: upsertResults.updated,
          errors: upsertResults.errors.length,
        },
        tables: scannedTables.map(t => ({
          recordType: t.recordType,
          suiteqlTable: t.suiteqlTable,
          label: t.label,
          recordCount: t.recordCount,
          category: t.category,
        })),
        errors: errors.slice(0, 50), // 只返回前 50 個錯誤
      },
    });
  } catch (error: any) {
    console.error('掃描 NetSuite 表錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '伺服器錯誤',
        message: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

/**
 * 生成中文標籤
 */
function generateLabel(recordType: string): string {
  const labelMap: Record<string, string> = {
    'subsidiary': '公司別',
    'currency': '幣別',
    'item': '產品主檔',
    'inventoryitem': '產品主檔',
    'customer': '客戶',
    'vendor': '供應商',
    'employee': '員工',
    'department': '部門',
    'location': '地點',
    'classification': '類別',
    'account': '會計科目',
    'taxitem': '稅碼',
    'salestaxitem': '稅碼',
    'expensecategory': '費用類別',
    'term': '付款條件',
    'shipitem': '運送方式',
    'bom': 'BOM',
    'workcenter': '工作中心',
    'salesorder': '銷售訂單',
    'purchaseorder': '採購訂單',
    'invoice': '發票',
    'vendorbill': '供應商帳單',
  };

  // 先檢查精確匹配
  if (labelMap[recordType]) {
    return labelMap[recordType];
  }

  // 嘗試從 record type 名稱推斷
  const words = recordType.replace(/([A-Z])/g, ' $1').toLowerCase().split(/\s+/);
  const capitalized = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  
  return capitalized || recordType;
}

/**
 * 生成 mapping_key
 */
function generateMappingKey(recordType: string): string {
  // 特殊映射
  const specialMap: Record<string, string> = {
    'inventoryitem': 'items',
    'taxitem': 'taxCodes',
    'salestaxitem': 'taxCodes',
    'classification': 'classes',
    'shipitem': 'shipMethods',
    'expensecategory': 'expenseCategories',
    'customer': 'customers',
    'vendor': 'vendors',
    'employee': 'employees',
    'subsidiary': 'subsidiaries',
    'currency': 'currencies',
    'department': 'departments',
    'location': 'locations',
    'account': 'accounts',
    'term': 'terms',
    'bom': 'bomHeaders',
  };

  if (specialMap[recordType]) {
    return specialMap[recordType];
  }

  // 一般規則：轉為複數形式
  if (recordType.endsWith('y')) {
    return recordType.slice(0, -1) + 'ies';
  } else if (recordType.endsWith('s') || recordType.endsWith('x') || recordType.endsWith('ch')) {
    return recordType + 'es';
  } else {
    return recordType + 's';
  }
}

/**
 * 判斷優先級
 */
function getPriority(category: string, recordType: string): '🔴 最高' | '🔴 高' | '🟡 中' | '🟢 低' {
  // 基礎主檔：最高優先級
  if (['subsidiary', 'currency', 'item', 'inventoryitem'].includes(recordType)) {
    return '🔴 最高';
  }

  // 重要主檔：高優先級
  if (['customer', 'vendor', 'employee', 'account', 'taxitem', 'salestaxitem'].includes(recordType)) {
    return '🔴 高';
  }

  // 一般主檔：中優先級
  if (category === 'master') {
    return '🟡 中';
  }

  // 交易類型：低優先級（通常需要更多配置）
  if (category === 'transaction') {
    return '🟢 低';
  }

  return '🟡 中';
}

/**
 * 判斷同步順序
 */
function getSyncOrder(category: string, priority: string, recordType: string): number {
  // 基礎主檔：1-10
  if (['subsidiary', 'currency', 'item', 'inventoryitem'].includes(recordType)) {
    const orderMap: Record<string, number> = {
      'subsidiary': 1,
      'currency': 2,
      'item': 3,
      'inventoryitem': 3,
    };
    return orderMap[recordType] || 10;
  }

  // 重要主檔：11-20
  if (['customer', 'vendor', 'employee', 'account'].includes(recordType)) {
    return 11;
  }

  // 一般主檔：21-50
  if (category === 'master') {
    return 30;
  }

  // 交易類型：51+
  if (category === 'transaction') {
    return 100;
  }

  return 999;
}

