/**
 * NetSuite 主檔表名與 API 路由對應配置
 * 
 * 用途：
 * 1. 統一管理所有 Supabase 表名
 * 2. 確保 API 路由與表名的一致性
 * 3. 方便搬家重建時快速對應
 * 
 * 使用方式：
 * import { TABLE_MAPPING, getAllTableMappings } from '@/lib/table-mapping';
 * const tableName = TABLE_MAPPING.subsidiaries.tableName;
 * 
 * 注意：此模組現在支援從資料庫讀取配置（table_mapping_config 表）
 * 如果資料庫中沒有配置，會 fallback 到 hard code 的配置
 */

export interface TableMapping {
  /** Supabase 表名 */
  tableName: string;
  /** 中文標籤 */
  label: string;
  /** API 路由路徑 */
  apiRoute: string;
  /** 優先級 */
  priority: '🔴 最高' | '🔴 高' | '🟡 中' | '🟢 低';
  /** 是否停用 */
  disabled?: boolean;
  /** 停用原因 */
  disabledReason?: string;
  /** 衝突處理欄位（用於 Upsert） */
  conflictColumn: string;
  /** NetSuite SuiteQL 表名 */
  netsuiteTable: string;
  /** 依賴的表（陣列） */
  dependsOn?: string[];
  /** 同步順序 */
  syncOrder?: number;
}

/**
 * 所有主檔表的對應配置
 */
export const TABLE_MAPPING: Record<string, TableMapping> = {
  subsidiaries: {
    tableName: 'ns_subsidiaries',
    label: '公司別',
    apiRoute: '/api/sync-subsidiaries',
    priority: '🔴 最高',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'subsidiary',
  },
  currencies: {
    tableName: 'ns_currencies',
    label: '幣別',
    apiRoute: '/api/sync-currencies',
    priority: '🔴 最高',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'currency',
  },
  accountingPeriods: {
    tableName: 'ns_accounting_periods',
    label: '會計期間',
    apiRoute: '/api/sync-accounting-periods',
    priority: '🔴 最高',
    disabled: true,
    disabledReason: 'SuiteQL 不支援',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'accountingperiod',
  },
  departments: {
    tableName: 'ns_departments',
    label: '部門',
    apiRoute: '/api/sync-departments',
    priority: '🟡 中',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'department',
  },
  classes: {
    tableName: 'ns_classes',
    label: '類別',
    apiRoute: '/api/sync-classes',
    priority: '🟡 中',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'classification',
  },
  locations: {
    tableName: 'ns_locations',
    label: '地點',
    apiRoute: '/api/sync-locations',
    priority: '🟡 中',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'location',
  },
  accounts: {
    tableName: 'ns_accounts',
    label: '會計科目',
    apiRoute: '/api/sync-accounts',
    priority: '🟡 中',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'account',
  },
  terms: {
    tableName: 'ns_terms',
    label: '付款條件',
    apiRoute: '/api/sync-terms',
    priority: '🟢 低',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'term',
  },
  taxCodes: {
    tableName: 'ns_tax_codes',
    label: '稅碼',
    apiRoute: '/api/sync-tax-codes',
    priority: '🔴 高',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'taxitem',
  },
  expenseCategories: {
    tableName: 'ns_expense_categories',
    label: '費用類別',
    apiRoute: '/api/sync-expense-categories',
    priority: '🟡 中',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'expensecategory',
  },
  items: {
    tableName: 'ns_items',
    label: '產品主檔',
    apiRoute: '/api/sync-items',
    priority: '🔴 最高',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'item',
  },
  customers: {
    tableName: 'ns_entities_customers',
    label: '客戶',
    apiRoute: '/api/sync-customers',
    priority: '🔴 高',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'customer',
  },
  vendors: {
    tableName: 'ns_entities_vendors',
    label: '供應商',
    apiRoute: '/api/sync-vendors',
    priority: '🟡 中',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'vendor',
  },
  employees: {
    tableName: 'ns_entities_employees',
    label: '員工',
    apiRoute: '/api/sync-employees',
    priority: '🟡 中',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'employee',
  },
  shipMethods: {
    tableName: 'ns_ship_methods',
    label: '運送方式',
    apiRoute: '/api/sync-ship-methods',
    priority: '🟢 低',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'shipitem',
  },
  // 製造業專屬
  bomHeaders: {
    tableName: 'ns_bom_headers',
    label: 'BOM 表頭',
    apiRoute: '/api/sync-bom-headers',
    priority: '🔴 最高',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'bom',
  },
  bomLines: {
    tableName: 'ns_bom_lines',
    label: 'BOM 明細',
    apiRoute: '/api/sync-bom-lines',
    priority: '🔴 最高',
    conflictColumn: 'id',
    netsuiteTable: 'bom',
  },
  workCenters: {
    tableName: 'ns_work_centers',
    label: '工作中心',
    apiRoute: '/api/sync-work-centers',
    priority: '🟡 中',
    conflictColumn: 'netsuite_internal_id',
    netsuiteTable: 'workcenter',
  },
};

/**
 * 取得所有表配置陣列（用於列表顯示）
 * 優先從資料庫讀取，如果失敗則使用 hard code 配置
 * 
 * 注意：此函數會嘗試從資料庫讀取，但如果在客戶端或 build 時執行，會自動 fallback
 */
export async function getAllTableMappings(): Promise<(TableMapping & { mappingKey?: string })[]> {
  // 客戶端直接返回 hard code 配置（加上 mappingKey）
  if (typeof window !== 'undefined') {
    return Object.entries(TABLE_MAPPING).map(([key, mapping]) => ({
      ...mapping,
      mappingKey: key, // 使用 key 作為 mapping_key
    }));
  }
  
  try {
    // 只在 server-side 嘗試從資料庫讀取
    // 使用動態 import 避免 build 時的問題
    const { loadTableMappingsFromDB } = await import('./table-mapping-server');
    const dbMappings = await loadTableMappingsFromDB();
    if (dbMappings && dbMappings.length > 0) {
      return dbMappings;
    }
  } catch (error) {
    // 如果導入或讀取失敗（例如在 build 時），使用 fallback
    // 不輸出錯誤，因為這是預期的行為
  }
  
  // Fallback 到 hard code 配置（加上 mappingKey）
  return Object.entries(TABLE_MAPPING).map(([key, mapping]) => ({
    ...mapping,
    mappingKey: key, // 使用 key 作為 mapping_key
  }));
}

/**
 * 同步版本：取得所有表配置陣列（用於客戶端或無法使用 async 的地方）
 * 注意：此函數只返回 hard code 配置，不從資料庫讀取
 */
export function getAllTableMappingsSync(): TableMapping[] {
  return Object.values(TABLE_MAPPING);
}

/**
 * 根據表名取得配置（從資料庫或 fallback）
 */
export async function getTableMappingByTableName(tableName: string): Promise<TableMapping | undefined> {
  // 客戶端直接返回 hard code 配置
  if (typeof window !== 'undefined') {
    return Object.values(TABLE_MAPPING).find(mapping => mapping.tableName === tableName);
  }
  
  try {
    const { loadTableMappingsFromDB } = await import('./table-mapping-server');
    const dbMappings = await loadTableMappingsFromDB();
    if (dbMappings) {
      return dbMappings.find((mapping: TableMapping) => mapping.tableName === tableName);
    }
  } catch (error) {
    // Fallback 到 hard code
  }
  
  return Object.values(TABLE_MAPPING).find(mapping => mapping.tableName === tableName);
}

/**
 * 根據 API 路由取得配置（從資料庫或 fallback）
 */
export async function getTableMappingByApiRoute(apiRoute: string): Promise<TableMapping | undefined> {
  // 客戶端直接返回 hard code 配置
  if (typeof window !== 'undefined') {
    return Object.values(TABLE_MAPPING).find(mapping => mapping.apiRoute === apiRoute);
  }
  
  try {
    const { loadTableMappingsFromDB } = await import('./table-mapping-server');
    const dbMappings = await loadTableMappingsFromDB();
    if (dbMappings) {
      return dbMappings.find((mapping: TableMapping) => mapping.apiRoute === apiRoute);
    }
  } catch (error) {
    // Fallback 到 hard code
  }
  
  return Object.values(TABLE_MAPPING).find(mapping => mapping.apiRoute === apiRoute);
}

/**
 * 根據 key 取得配置（從資料庫或 fallback）
 */
export async function getTableMapping(key: string): Promise<TableMapping | undefined> {
  // 客戶端直接返回 hard code 配置
  if (typeof window !== 'undefined') {
    return TABLE_MAPPING[key];
  }
  
  try {
    const { loadTableMappingsFromDB } = await import('./table-mapping-server');
    const dbMappings = await loadTableMappingsFromDB();
    if (dbMappings) {
      // 在資料庫中，mapping_key 對應到程式碼中的 key
      // 需要透過 tableName 或其他方式找到對應的配置
      // 這裡先 fallback 到 hard code
      return TABLE_MAPPING[key];
    }
  } catch (error) {
    // Fallback 到 hard code
  }
  
  return TABLE_MAPPING[key];
}

/**
 * 同步版本：根據表名取得配置（只從 hard code 讀取）
 */
export function getTableMappingByTableNameSync(tableName: string): TableMapping | undefined {
  return Object.values(TABLE_MAPPING).find(mapping => mapping.tableName === tableName);
}

/**
 * 同步版本：根據 API 路由取得配置（只從 hard code 讀取）
 */
export function getTableMappingByApiRouteSync(apiRoute: string): TableMapping | undefined {
  return Object.values(TABLE_MAPPING).find(mapping => mapping.apiRoute === apiRoute);
}

/**
 * 同步版本：根據 key 取得配置（只從 hard code 讀取）
 */
export function getTableMappingSync(key: string): TableMapping | undefined {
  return TABLE_MAPPING[key];
}

/**
 * 驗證表名是否存在於配置中
 */
export function isValidTableName(tableName: string): boolean {
  return Object.values(TABLE_MAPPING).some(mapping => mapping.tableName === tableName);
}

/**
 * 驗證 API 路由是否存在於配置中
 */
export function isValidApiRoute(apiRoute: string): boolean {
  return Object.values(TABLE_MAPPING).some(mapping => mapping.apiRoute === apiRoute);
}

