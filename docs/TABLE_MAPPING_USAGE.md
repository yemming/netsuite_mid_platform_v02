# Table Mapping 使用指南

## 📋 概述

`lib/table-mapping.ts` 是統一的表名與 API 路由對應配置檔案，用於確保：
- ✅ API 路由與 Supabase 表名的一致性
- ✅ 搬家重建時快速對應
- ✅ 避免硬編碼表名導致的錯誤

## 🔧 配置檔案位置

```
lib/table-mapping.ts
```

## 📝 配置結構

每個表的配置包含：
- `tableName`: Supabase 表名（如 `ns_subsidiaries`）
- `label`: 中文標籤（如 `公司別`）
- `apiRoute`: API 路由（如 `/api/sync-subsidiaries`）
- `priority`: 優先級（🔴 最高 / 🔴 高 / 🟡 中 / 🟢 低）
- `conflictColumn`: Upsert 衝突處理欄位（通常是 `netsuite_internal_id`）
- `netsuiteTable`: NetSuite SuiteQL 表名（如 `subsidiary`）

## 💡 使用範例

### 1. 在 API Route 中使用

**修改前（硬編碼）：**
```typescript
// app/api/sync-subsidiaries/route.ts
const { data } = await supabase
  .from('ns_subsidiaries')  // ❌ 硬編碼
  .upsert(recordsToUpsert, {
    onConflict: 'netsuite_internal_id',
  });
```

**修改後（使用配置）：**
```typescript
// app/api/sync-subsidiaries/route.ts
import { TABLE_MAPPING } from '@/lib/table-mapping';

const mapping = TABLE_MAPPING.subsidiaries;
const { data } = await supabase
  .from(mapping.tableName)  // ✅ 從配置取得
  .upsert(recordsToUpsert, {
    onConflict: mapping.conflictColumn,  // ✅ 從配置取得
  });
```

### 2. 在同步狀態查詢中使用

```typescript
// app/api/sync-status/route.ts
import { getAllTableMappings } from '@/lib/table-mapping';

const tables = getAllTableMappings()
  .filter(mapping => !mapping.disabled)
  .map(mapping => ({
    name: mapping.tableName,
    label: mapping.label,
  }));
```

### 3. 在前端設定頁面中使用

```typescript
// app/dashboard/settings/page.tsx
import { getAllTableMappings } from '@/lib/table-mapping';

const TABLE_CONFIG = getAllTableMappings().map(mapping => ({
  name: mapping.tableName,
  label: mapping.label,
  api: mapping.apiRoute,
  priority: mapping.priority,
  disabled: mapping.disabled,
  disabledReason: mapping.disabledReason,
}));
```

### 4. 根據 API 路由查找配置

```typescript
import { getTableMappingByApiRoute } from '@/lib/table-mapping';

// 在 API route 中自動取得配置
const mapping = getTableMappingByApiRoute('/api/sync-subsidiaries');
if (mapping) {
  const tableName = mapping.tableName;  // 'ns_subsidiaries'
  const conflictColumn = mapping.conflictColumn;  // 'netsuite_internal_id'
}
```

### 5. 驗證表名是否存在

```typescript
import { isValidTableName } from '@/lib/table-mapping';

if (isValidTableName('ns_subsidiaries')) {
  // 表名存在於配置中
}
```

## 🔄 搬家重建檢查清單

當你要搬家重建時，請確認：

1. ✅ **檢查配置檔案**
   ```bash
   # 查看所有表配置
   cat lib/table-mapping.ts
   ```

2. ✅ **驗證 Supabase 表是否存在**
   ```sql
   -- 在 Supabase SQL Editor 中執行
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name LIKE 'ns_%'
   ORDER BY table_name;
   ```

3. ✅ **對照配置與實際表名**
   - 配置中的 `tableName` 必須與 Supabase 中的表名完全一致
   - 配置中的 `apiRoute` 必須與實際的 API 路由一致

4. ✅ **測試 API 路由**
   ```bash
   # 測試每個 API 路由
   curl -X POST http://localhost:3000/api/sync-subsidiaries
   ```

## 📊 目前配置的所有表

| Key | 表名 | API 路由 | 優先級 |
|-----|------|---------|--------|
| `subsidiaries` | `ns_subsidiaries` | `/api/sync-subsidiaries` | 🔴 最高 |
| `currencies` | `ns_currencies` | `/api/sync-currencies` | 🔴 最高 |
| `departments` | `ns_departments` | `/api/sync-departments` | 🟡 中 |
| `classes` | `ns_classes` | `/api/sync-classes` | 🟡 中 |
| `locations` | `ns_locations` | `/api/sync-locations` | 🟡 中 |
| `accounts` | `ns_accounts` | `/api/sync-accounts` | 🟡 中 |
| `items` | `ns_items` | `/api/sync-items` | 🔴 最高 |
| `customers` | `ns_entities_customers` | `/api/sync-customers` | 🔴 高 |
| `vendors` | `ns_entities_vendors` | `/api/sync-vendors` | 🟡 中 |
| `employees` | `ns_entities_employees` | `/api/sync-employees` | 🟡 中 |
| `taxCodes` | `ns_tax_codes` | `/api/sync-tax-codes` | 🔴 高 |
| `expenseCategories` | `ns_expense_categories` | `/api/sync-expense-categories` | 🟡 中 |
| `terms` | `ns_terms` | `/api/sync-terms` | 🟢 低 |
| `shipMethods` | `ns_ship_methods` | `/api/sync-ship-methods` | 🟢 低 |
| `accountingPeriods` | `ns_accounting_periods` | `/api/sync-accounting-periods` | 🔴 最高 (停用) |

## ⚠️ 注意事項

1. **表名變更**：如果修改了配置中的表名，必須同時更新：
   - Supabase 中的實際表名
   - 所有使用該表名的程式碼

2. **API 路由變更**：如果修改了配置中的 API 路由，必須同時更新：
   - Next.js 的 API route 檔案位置
   - 前端呼叫該 API 的程式碼

3. **新增表**：新增表時，請在 `lib/table-mapping.ts` 中加入配置，並確保：
   - Supabase 表已建立
   - API route 已建立
   - 配置資訊完整且正確

## 🔍 驗證工具

可以使用以下工具驗證配置：

```typescript
import { 
  getAllTableMappings, 
  isValidTableName, 
  isValidApiRoute 
} from '@/lib/table-mapping';

// 列出所有配置
console.log(getAllTableMappings());

// 驗證表名
console.log(isValidTableName('ns_subsidiaries'));  // true

// 驗證 API 路由
console.log(isValidApiRoute('/api/sync-subsidiaries'));  // true
```

