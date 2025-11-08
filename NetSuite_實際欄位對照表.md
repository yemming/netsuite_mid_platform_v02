# NetSuite 實際欄位對照表

> **建立日期**: 2025-11-04  
> **用途**: 記錄 NetSuite SuiteQL 實際欄位名稱，對照指南中的欄位名稱

---

## 1. Subsidiary（公司別）

### ✅ 實際查到的欄位

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | INTEGER | ✅ 正確 |
| name | `name` | VARCHAR | ✅ 正確 |
| legalname | `legalname` | VARCHAR | ✅ 正確（可能為 NULL） |
| country | `country` | VARCHAR | ✅ 正確 |
| currency | `currency` | INTEGER | ✅ 正確 |
| isinactive | `isinactive` | VARCHAR('F'/'T') | ✅ 正確 |

### ⚠️ 額外發現的欄位

- `fullname` - 完整名稱（包含階層）
- `parent` - 父公司 ID
- `iselimination` - 是否為合併排除公司
- `mainaddress` - 主要地址 ID
- `shippingaddress` - 運送地址 ID
- `returnaddress` - 退回地址 ID
- `email` - 電子郵件
- `state` - 州/省
- `fiscalcalendar` - 會計年度曆 ID
- `lastmodifieddate` - 最後修改日期

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE ns_subsidiaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),                    -- legalname
  country VARCHAR(100),                        -- country
  base_currency_id INTEGER,                    -- currency
  parent_id INTEGER,                           -- parent
  full_name VARCHAR(500),                      -- fullname
  is_elimination BOOLEAN DEFAULT FALSE,        -- iselimination = 'T'
  is_active BOOLEAN DEFAULT TRUE,              -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Currency（幣別）

### ✅ 實際查到的欄位

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | INTEGER | ✅ 正確 |
| name | `name` | VARCHAR | ✅ 正確 |
| symbol | `symbol` | VARCHAR | ✅ 正確 |
| exchangerate | `exchangerate` | DECIMAL | ✅ 正確 |
| isbasecurrency | `isbasecurrency` | VARCHAR('T'/'F') | ✅ 正確 |
| isinactive | `isinactive` | VARCHAR('F'/'T') | ✅ 正確 |

### ⚠️ 額外發現的欄位

- `displaysymbol` - 顯示符號（如 "$"）
- `symbolplacement` - 符號位置
- `currencyprecision` - 貨幣精度（小數位數）
- `overridecurrencyformat` - 是否覆蓋貨幣格式
- `includeinfxrateupdates` - 是否包含在匯率更新中
- `fxrateupdatetimezone` - 匯率更新時區
- `lastmodifieddate` - 最後修改日期

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE ns_currencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,                  -- name
  symbol VARCHAR(10),                          -- symbol
  display_symbol VARCHAR(10),                  -- displaysymbol
  exchange_rate DECIMAL(15,6),                -- exchangerate
  is_base_currency BOOLEAN DEFAULT FALSE,      -- isbasecurrency = 'T'
  currency_precision INTEGER DEFAULT 2,        -- currencyprecision
  is_active BOOLEAN DEFAULT TRUE,              -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Department（部門）

### ✅ 實際查到的欄位

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | INTEGER | ✅ 正確 |
| name | `name` | VARCHAR | ✅ 正確 |
| subsidiary | `subsidiary` | VARCHAR | ⚠️ **注意：是字串列表 "1, 3, 4"** |
| parent | `parent` | INTEGER | ✅ 正確 |
| fullname | `fullname` | VARCHAR | ✅ 正確 |
| isinactive | `isinactive` | VARCHAR('F'/'T') | ✅ 正確 |

### ⚠️ 關鍵發現

- **`subsidiary` 欄位是字串列表**，不是單一 INTEGER！格式為 "1, 3, 4, 5"
- `includechildren` - 是否包含子部門

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE ns_departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,                  -- name
  subsidiary_ids TEXT,                         -- subsidiary (字串列表，需要解析)
  parent_id INTEGER,                            -- parent
  full_name VARCHAR(500),                       -- fullname
  include_children BOOLEAN DEFAULT FALSE,       -- includechildren = 'T'
  is_inactive BOOLEAN DEFAULT FALSE,           -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Classification（類別）

### ✅ 實際查到的欄位

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | INTEGER | ✅ 正確 |
| name | `name` | VARCHAR | ✅ 正確 |
| subsidiary | `subsidiary` | VARCHAR | ⚠️ **注意：是字串列表** |
| parent | `parent` | INTEGER | ✅ 正確 |
| fullname | `fullname` | VARCHAR | ✅ 正確 |
| isinactive | `isinactive` | VARCHAR('F'/'T') | ✅ 正確 |

### ⚠️ 關鍵發現

- **與 Department 相同結構**，`subsidiary` 也是字串列表

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE ns_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,                  -- name
  subsidiary_ids TEXT,                          -- subsidiary (字串列表)
  parent_id INTEGER,                            -- parent
  full_name VARCHAR(500),                       -- fullname
  include_children BOOLEAN DEFAULT FALSE,       -- includechildren = 'T'
  is_inactive BOOLEAN DEFAULT FALSE,            -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Location（地點）

### ✅ 實際查到的欄位

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | INTEGER | ✅ 正確 |
| name | `name` | VARCHAR | ✅ 正確 |
| subsidiary | `subsidiary` | VARCHAR | ⚠️ **注意：是字串列表 "1"** |
| usebins | ❌ 不存在 | - | ⚠️ **指南錯誤** |
| isinactive | `isinactive` | VARCHAR('F'/'T') | ✅ 正確 |

### ⚠️ 額外發現的欄位

- `fullname` - 完整名稱
- `parent` - 父地點 ID
- `mainaddress` - 主要地址 ID
- `locationtype` - 地點類型
- `makeinventoryavailable` - 是否讓庫存可用
- `makeinventoryavailablestore` - 是否讓庫存可用於商店
- `latitude` / `longitude` - 經緯度
- `tranprefix` - 交易前綴

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE ns_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,                  -- name
  subsidiary_ids TEXT,                         -- subsidiary (字串列表)
  parent_id INTEGER,                            -- parent
  full_name VARCHAR(500),                       -- fullname
  location_type VARCHAR(100),                   -- locationtype
  main_address_id INTEGER,                      -- mainaddress
  make_inventory_available BOOLEAN DEFAULT TRUE, -- makeinventoryavailable = 'T'
  is_inactive BOOLEAN DEFAULT FALSE,             -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Account（會計科目）

### ✅ 實際查到的欄位

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | INTEGER | ✅ 正確 |
| acctnumber | `acctnumber` | ❌ **不存在** | ⚠️ **指南錯誤** |
| acctname | `acctname` | ❌ **不存在** | ⚠️ **指南錯誤** |
| accttype | `accttype` | VARCHAR | ✅ 正確 |
| subsidiary | `subsidiary` | VARCHAR | ⚠️ **字串列表** |
| isinactive | `isinactive` | VARCHAR('F'/'T') | ✅ 正確 |

### ⚠️ 關鍵發現

- **`acctnumber` 和 `acctname` 不存在！**
- 實際欄位：
  - `accountsearchdisplayname` - 帳戶搜尋顯示名稱（類似 name）
  - `displaynamewithhierarchy` - 階層顯示名稱（如 "Salaries & Wages : Bonus"）
  - `parent` - 父帳戶 ID
  - `issummary` - 是否為摘要帳戶

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE ns_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  account_search_display_name VARCHAR(255),      -- accountsearchdisplayname
  display_name_with_hierarchy VARCHAR(500),     -- displaynamewithhierarchy
  acct_type VARCHAR(100),                       -- accttype (Income, Expense, Asset, etc.)
  subsidiary_ids TEXT,                          -- subsidiary (字串列表)
  parent_id INTEGER,                            -- parent
  is_summary BOOLEAN DEFAULT FALSE,             -- issummary = 'T'
  is_inactive BOOLEAN DEFAULT FALSE,             -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Item（產品主檔）

### ✅ 實際查到的欄位

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | INTEGER | ✅ 正確 |
| itemid | `itemid` | VARCHAR | ✅ 正確 |
| displayname | `displayname` | VARCHAR | ✅ 正確 |
| itemtype | `itemtype` | VARCHAR | ✅ 正確 |
| description | `description` | TEXT | ✅ 正確 |
| salesdescription | `salesdescription` | TEXT | ✅ 正確 |
| purchasedescription | `purchasedescription` | TEXT | ✅ 正確 |
| baseprice | `baseprice` | DECIMAL | ✅ 正確 |
| incomeaccount | `incomeaccount` | INTEGER | ✅ 正確 |
| expenseaccount | `expenseaccount` | INTEGER | ✅ 正確 |
| assetaccount | `assetaccount` | INTEGER | ✅ 正確 |
| isinactive | `isinactive` | VARCHAR('F'/'T') | ✅ 正確 |

### ⚠️ 額外發現的欄位

- `fullname` - 完整名稱
- `parent` - 父項目 ID（用於矩陣項目）
- `subtype` - 子類型
- `costingmethod` - 成本計算方法
- `subsidiary` - 子公司 ID（字串列表）
- `class` / `department` / `location` - 預設值
- `lastmodifieddate` - 最後修改日期

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE ns_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  item_id VARCHAR(255) NOT NULL,                 -- itemid
  name VARCHAR(255),                             -- displayname
  display_name VARCHAR(255),                     -- displayname
  full_name VARCHAR(500),                       -- fullname
  item_type VARCHAR(100),                        -- itemtype
  description TEXT,                             -- description
  sales_description TEXT,                       -- salesdescription
  purchase_description TEXT,                    -- purchasedescription
  base_price DECIMAL(15,2),                     -- baseprice
  income_account_id INTEGER,                    -- incomeaccount
  expense_account_id INTEGER,                   -- expenseaccount
  asset_account_id INTEGER,                     -- assetaccount
  costing_method VARCHAR(50),                   -- costingmethod
  is_inactive BOOLEAN DEFAULT FALSE,            -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Customer（客戶）

### ✅ 實際查到的欄位

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | INTEGER | ✅ 正確 |
| entityid | `entityid` | VARCHAR | ✅ 正確 |
| companyname | `companyname` | VARCHAR | ✅ 正確 |
| email | `email` | VARCHAR | ✅ 正確 |
| phone | `phone` | VARCHAR | ✅ 正確 |
| subsidiary | `subsidiary` | ❌ **不存在** | ⚠️ **指南錯誤** |
| currency | `currency` | INTEGER | ✅ 正確 |
| terms | `terms` | INTEGER | ✅ 正確 |
| isinactive | `isinactive` | VARCHAR('F'/'T') | ✅ 正確 |

### ⚠️ 關鍵發現

- **`subsidiary` 欄位不存在！**
- 實際欄位：
  - `fullname` / `entitytitle` - 完整名稱
  - `altname` - 替代名稱
  - `isperson` - 是否為個人
  - `firstname` / `lastname` - 姓名（個人用）

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE ns_entities_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  entity_id VARCHAR(255),                        -- entityid
  name VARCHAR(255) NOT NULL,                    -- companyname 或 fullname
  company_name VARCHAR(255),                     -- companyname
  alt_name VARCHAR(255),                         -- altname
  is_person BOOLEAN DEFAULT FALSE,               -- isperson = 'T'
  first_name VARCHAR(100),                       -- firstname
  last_name VARCHAR(100),                        -- lastname
  email VARCHAR(255),                            -- email
  phone VARCHAR(100),                            -- phone
  currency_id INTEGER,                           -- currency
  terms_id INTEGER,                              -- terms
  is_inactive BOOLEAN DEFAULT FALSE,            -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. Vendor（供應商）

### ✅ 實際查到的欄位

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | INTEGER | ✅ 正確 |
| entityid | `entityid` | VARCHAR | ✅ 正確 |
| companyname | `companyname` | VARCHAR | ✅ 正確 |
| email | `email` | VARCHAR | ✅ 正確 |
| phone | `phone` | VARCHAR | ✅ 正確 |
| subsidiary | `subsidiary` | ❌ **不存在** | ⚠️ **指南錯誤** |
| currency | `currency` | INTEGER | ✅ 正確 |
| terms | `terms` | INTEGER | ✅ 正確 |
| isinactive | `isinactive` | VARCHAR('F'/'T') | ✅ 正確 |

### ⚠️ 關鍵發現

- **與 Customer 類似，`subsidiary` 不存在**

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE ns_entities_vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  entity_id VARCHAR(255),                        -- entityid
  name VARCHAR(255) NOT NULL,                    -- companyname 或 fullname
  company_name VARCHAR(255),                     -- companyname
  alt_name VARCHAR(255),                         -- altname
  is_person BOOLEAN DEFAULT FALSE,               -- isperson = 'T'
  email VARCHAR(255),                            -- email
  phone VARCHAR(100),                            -- phone
  currency_id INTEGER,                           -- currency
  terms_id INTEGER,                              -- terms
  is_inactive BOOLEAN DEFAULT FALSE,            -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 10. Employee（員工）

### ✅ 實際查到的欄位

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | INTEGER | ✅ 正確 |
| entityid | `entityid` | VARCHAR | ✅ 正確 |
| firstname | `firstname` | VARCHAR | ✅ 正確 |
| lastname | `lastname` | VARCHAR | ✅ 正確 |
| email | `email` | VARCHAR | ✅ 正確 |
| department | `department` | INTEGER | ✅ 正確 |
| subsidiary | `subsidiary` | INTEGER | ✅ 正確 |
| isinactive | `isinactive` | VARCHAR('F'/'T') | ✅ 正確 |

### ⚠️ 額外發現的欄位

- `fullname` - 完整名稱（firstname + lastname）
- `title` - 職稱
- `hiredate` - 雇用日期
- `employee_status` - 員工狀態
- `employeetype` - 員工類型

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE ns_entities_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  entity_id VARCHAR(255),                        -- entityid
  first_name VARCHAR(100),                        -- firstname
  last_name VARCHAR(100),                         -- lastname
  name VARCHAR(255) NOT NULL,                     -- fullname (firstname || ' ' || lastname)
  email VARCHAR(255),                             -- email
  title VARCHAR(100),                             -- title
  department_id INTEGER,                          -- department
  subsidiary_id INTEGER,                          -- subsidiary
  hire_date DATE,                                 -- hiredate
  is_inactive BOOLEAN DEFAULT FALSE,              -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 11. Sales Tax Item（稅碼）

### ✅ 實際查到的欄位

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | INTEGER | ✅ 正確 |
| itemid | `itemid` | VARCHAR | ✅ 正確（不是 name） |
| rate | `rate` | DECIMAL | ✅ 正確 |
| description | `description` | TEXT | ✅ 正確 |
| isinactive | `isinactive` | VARCHAR('F'/'T') | ✅ 正確 |

### ⚠️ 關鍵發現

- **指南中使用 `name`，但實際是 `itemid`**
- `fullname` - 完整名稱（階層）
- `parent` - 父稅碼
- `taxaccount` / `saleaccount` - 稅務帳戶

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE ns_tax_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,                    -- itemid (實際欄位名)
  full_name VARCHAR(500),                        -- fullname
  rate DECIMAL(5,2),                             -- rate
  description TEXT,                              -- description
  parent_id INTEGER,                             -- parent
  tax_account_id INTEGER,                        -- taxaccount
  sale_account_id INTEGER,                       -- saleaccount
  is_inactive BOOLEAN DEFAULT FALSE,             -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 12. Expense Category（費用類別）

### ✅ 實際查到的欄位

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | INTEGER | ✅ 正確 |
| name | `name` | VARCHAR | ✅ 正確 |
| expenseacct | `expenseacct` | INTEGER | ✅ 正確 |
| account | ❌ **不存在** | - | ⚠️ **指南錯誤** |
| isinactive | `isinactive` | VARCHAR('F'/'T') | ✅ 正確 |

### ⚠️ 關鍵發現

- **指南中使用 `account`，但實際是 `expenseacct`**
- `subsidiary` - 子公司 ID（字串列表）
- `defaultrate` - 預設費率
- `raterequired` - 是否要求費率

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE ns_expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,                    -- name
  expense_account_id INTEGER,                    -- expenseacct
  default_rate DECIMAL(15,2),                    -- defaultrate
  rate_required BOOLEAN DEFAULT FALSE,           -- raterequired = 'T'
  is_inactive BOOLEAN DEFAULT FALSE,              -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 13. Term（付款條件）

### ✅ 實際查到的欄位

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | INTEGER | ✅ 正確 |
| name | `name` | VARCHAR | ✅ 正確 |
| daysuntilnetdue | `daysuntilnetdue` | INTEGER | ✅ 正確 |
| discountpercent | `discountpercent` | DECIMAL | ✅ 正確 |
| daysuntilexpiry | `daysuntilexpiry` | INTEGER | ✅ 正確 |
| isinactive | `isinactive` | VARCHAR('F'/'T') | ✅ 正確 |

### ⚠️ 額外發現的欄位

- `datedriven` - 是否為日期驅動
- `duenextmonthifwithindays` - 幾天內到期則下月到期
- `dayofmonthnetdue` - 到期月份日期

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE ns_terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,                    -- name
  days_until_net_due INTEGER,                    -- daysuntilnetdue
  discount_percent DECIMAL(5,2),                -- discountpercent
  days_until_expiry INTEGER,                     -- daysuntilexpiry
  is_date_driven BOOLEAN DEFAULT FALSE,          -- datedriven = 'T'
  is_inactive BOOLEAN DEFAULT FALSE,             -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 14. Accounting Period（會計期間）

### ✅ 實際查到的欄位（透過 REST API）

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | STRING | ✅ 正確（REST API 返回字串） |
| periodName | `periodName` | VARCHAR | ✅ 正確 |
| startDate | `startDate` | DATE | ✅ 正確 |
| endDate | `endDate` | DATE | ✅ 正確 |
| isQuarter | `isQuarter` | BOOLEAN | ✅ 正確 |
| isYear | `isYear` | BOOLEAN | ✅ 正確 |
| isClosed | `closed` | BOOLEAN | ⚠️ **注意：欄位名是 `closed`，不是 `isClosed`** |
| isInactive | `isInactive` | BOOLEAN | ✅ 正確 |

### ⚠️ 額外發現的欄位

- `isAdjustment` - ❌ **不存在**（指南中有，但實際不存在）
- `allLocked` - 所有科目都已鎖定
- `allowNonGLChanges` - 是否允許非 GL 變更
- `apLocked` - 應付帳款已鎖定
- `arLocked` - 應收帳款已鎖定
- `isPosting` - 是否可過帳
- `fiscalCalendar` - 會計年度曆（物件，包含 id 和 refName）
- `lastModifiedDate` - 最後修改日期

### ⚠️ 關鍵發現

1. **SuiteQL 不支援**：`accountingperiod` 表無法透過 SuiteQL 查詢
2. **必須使用 REST API**：只有透過 REST API 才能取得資料
3. **欄位名稱差異**：
   - 指南中使用 `isClosed`，但實際是 `closed`
   - 指南中使用 `isAdjustment`，但實際 REST API 中不存在此欄位
4. **ID 格式**：REST API 返回的 `id` 是字串，需要轉換為 INTEGER

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE <accountid>_accounting_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,     -- id (轉換為 INTEGER)
  
  -- 期間資訊
  period_name VARCHAR(100),                         -- periodName
  start_date DATE,                                   -- startDate
  end_date DATE,                                     -- endDate
  
  -- 期間類型
  is_quarter BOOLEAN DEFAULT FALSE,                -- isQuarter
  is_year BOOLEAN DEFAULT FALSE,                    -- isYear
  
  -- 狀態
  is_closed BOOLEAN DEFAULT FALSE,                 -- closed (注意：不是 isClosed)
  is_inactive BOOLEAN DEFAULT FALSE,                -- isInactive
  is_posting BOOLEAN DEFAULT FALSE,                 -- isPosting
  
  -- 鎖定狀態
  all_locked BOOLEAN DEFAULT FALSE,                 -- allLocked
  ap_locked BOOLEAN DEFAULT FALSE,                  -- apLocked
  ar_locked BOOLEAN DEFAULT FALSE,                  -- arLocked
  allow_non_gl_changes BOOLEAN DEFAULT FALSE,       -- allowNonGLChanges
  
  -- 會計年度曆
  fiscal_calendar_id INTEGER,                        -- fiscalCalendar.id
  
  -- 同步
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 📝 同步實作方式

**必須使用 REST API**，無法使用 SuiteQL：

```typescript
// 使用 REST API List API
const result = await netsuite.getRecordList('accountingperiod', {
  fetchAll: true,
  limit: 1000,
});

// 轉換資料時注意：
// 1. id 是字串，需要 parseInt(item.id)
// 2. closed 不是 isClosed
// 3. isAdjustment 不存在，需要移除
```

---

## 15. Ship Item（運送方式）

### ✅ 實際查到的欄位

| 指南欄位名 | 實際 NetSuite 欄位名 | 類型 | 說明 |
|-----------|---------------------|------|------|
| id | `id` | INTEGER | ✅ 正確 |
| itemid | `itemid` | VARCHAR | ✅ 正確（不是 name） |
| description | `description` | TEXT | ✅ 正確 |
| isinactive | `isinactive` | VARCHAR('F'/'T') | ✅ 正確 |

### ⚠️ 關鍵發現

- **指南中使用 `name`，但實際是 `itemid`**
- `subsidiary` - 子公司 ID（字串列表）
- `displayname` - 顯示名稱
- `servicecode` - 服務代碼

### 📝 建議的 CREATE TABLE

```sql
CREATE TABLE ns_ship_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,                    -- itemid (實際欄位名)
  description TEXT,                              -- description
  display_name VARCHAR(255),                     -- displayname
  service_code VARCHAR(100),                     -- servicecode
  is_inactive BOOLEAN DEFAULT FALSE,             -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 16. BOM（配方表頭）

### ⚠️ 問題

- **SuiteQL 中找不到 `bom` 表** - 已確認 SuiteQL 不支援
- REST API 中存在 `bom` record type（在 metadata catalog 中確認存在）
- **List API 查詢失敗**：`Record 'bom' was not found`
- 可能原因：
  1. 權限問題（類似 Accounting Period，需要開啟權限）
  2. 系統中沒有 Assembly Items（沒有建立任何 BOM）
  3. BOM 功能未啟用

### ✅ 測試結果（製造模組啟用後）

**✅ 成功項目**：
- ✅ **BOM List API 成功** - `bom` record type 現在可以查詢（雖然目前沒有資料，count: 0）
- ✅ **Assembly Items List API 成功** - `assemblyitem` record type 可以查詢（雖然目前沒有資料，count: 0）
- ✅ `bom` 在 metadata catalog 中存在
- ✅ `bomrevision` 在 metadata catalog 中存在

**❌ 失敗項目**：
- ❌ **Work Center** - 所有可能的名稱都失敗：
  - `workcenter` - Record type does not exist
  - `workcenteritem` - Record type does not exist
  - `manufacturingworkcenter` - Record type does not exist
  - `productionworkcenter` - Record type does not exist
- ❌ **Routing** - 所有可能的名稱都失敗：
  - `routing` - Record type does not exist
  - `manufacturingrouting` - Record 'manufacturingrouting' was not found
  - `routingoperation` - Record type does not exist
  - `routingstep` - Record type does not exist
  - `manufacturingoperationtask` - Record 'manufacturingoperationtask' was not found

**結論**：
- ✅ **BOM 功能已可用** - 製造模組啟用後，BOM API 可以正常查詢
- ⚠️ **Work Center 和 Routing** - 這些 record types 可能：
  1. 不存在於 REST API 中（只存在於 SuiteScript 或 SOAP API）
  2. 需要不同的權限或功能訂閱
  3. 或需要使用不同的查詢方式

### 📝 建議的解決方案

#### 方案 1: 檢查製造模組是否啟用
**重要發現**：根據 API 手冊和實際測試：
- BOM 功能通常整合在「製造模組」中
- 如果找不到 "Assembly Items" 或 "Bill of Materials" 權限，可能是製造模組未啟用
- Work Center 權限存在，但 Assembly Item 和 BOM 權限不存在 → 可能是製造模組部分啟用

**檢查步驟**：
1. 聯繫 NetSuite 管理員確認是否啟用「製造模組」
2. 確認帳戶是否訂閱製造功能

#### 方案 2: 檢查權限（製造模組相關）
在 NetSuite UI 中檢查：
1. **Lists > Items** - 查看是否有 "Assembly" 類型的 Items
2. **Lists > Assembly Items** - 如果看不到此選項，可能是製造模組未啟用
3. **Lists > Bill of Materials** - 如果看不到此選項，可能是製造模組未啟用
4. **Lists > Work Centers** - ✅ 您已確認存在（部分製造功能可用）
5. **Setup > REST Web 服務** - 確認 API 權限

#### 方案 3: 檢查是否有 Assembly Items
如果系統中沒有 Assembly Items，就不會有 BOM：
- 前往 NetSuite UI：**Lists > Items**
- 篩選 Item Type = "Assembly"
- 確認是否有 Assembly Items
- 如果沒有，需要先建立 Assembly Items 和對應的 BOM

#### 方案 4: 透過 Assembly Item 關聯查詢（如果製造模組啟用後）
如果已知 Assembly Item ID，可以：
1. 先取得 Assembly Item 的詳細資訊
2. 從 Assembly Item 中取得 BOM ID（如果有 `billOfMaterials` 欄位）
3. 使用該 BOM ID 查詢單一 BOM 記錄

### 📝 建議的 CREATE TABLE（先保留）

```sql
CREATE TABLE <accountid>_bom_headers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- BOM 資訊
  assembly_item_id INTEGER NOT NULL,              -- 成品的 Item ID
  name VARCHAR(255),                               -- BOM 名稱
  revision VARCHAR(50),                            -- 版本號（如 "Rev A"）
  
  -- 有效期間
  is_active BOOLEAN DEFAULT TRUE,
  effective_date DATE,                             -- 生效日期
  obsolete_date DATE,                              -- 廢止日期
  
  -- 說明
  memo TEXT,
  
  -- 同步
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 📝 同步實作方式（✅ 已確認可用）

**目前狀態**：✅ **BOM API 可以正常查詢**（製造模組啟用後，已測試成功）

**實際測試結果**（建立測試 BOM "AAA BOM" 後）：
- ✅ REST API List API 成功
- ✅ 可以取得 BOM 詳細資訊
- ✅ 找到 1 個 BOM 記錄

**實際欄位結構**（根據測試結果 - AAA BOM）：
```typescript
{
  id: "1",                    // Internal ID（字串）
  name: "AAA BOM",            // BOM 名稱
  assembly: {                 // 組裝件（物件，包含 links）
    links: [{
      rel: "self",
      href: "https://.../bom/1/assembly"
    }]
  },
  availableForAllAssemblies: true,
  availableForAllLocations: true,
  createdDate: "2025-11-05T21:26:00Z",
  customForm: {
    id: "-10505",
    refName: "Standard Bill of Materials Form"
  },
  includeChildren: false,
  isInactive: false,
  lastModifiedDate: "2025-11-05T21:27:00Z",
  restrictToAssemblies: { links: [...] },
  restrictToLocations: { links: [...] },
  subsidiary: { links: [...] },
  useComponentYield: false,
  usedOnAssembly: true
}
```

**Assembly Item 關聯**（Assembly Item "AAA" ID: 328）：
- Assembly Item 有 `billOfMaterials` 欄位，指向 BOM
- BOM 有 `assembly` 欄位，指向 Assembly Item
- 兩者透過 links 關聯，不是直接的 ID

**BOM Components（配方明細）**：
- ⚠️ 無法透過 sub-resource 端點（如 `/bom/1/component`）查詢
- ⚠️ 可能需要透過其他方式取得（如 SuiteQL 或 SuiteScript）
- 或需要查詢 `bomcomponent` record type（如果存在）

**實作方式**：
```typescript
// 使用 REST API List API（已確認可用）
const result = await netsuite.getRecordList('bom', {
  fetchAll: true,
  limit: 1000,
});

// 轉換資料時注意：
// 1. id 是字串，需要 parseInt(item.id)
// 2. assembly 是物件，需要取得 assembly.id 或透過 links 取得
// 3. subsidiary 是物件，需要取得 subsidiary.id
// 4. 需要額外查詢 BOM Lines（components）從 BOM 詳細資訊中取得
```

**注意事項**：
- ✅ 已確認可以透過 REST API 查詢 BOM
- ⚠️ BOM 記錄中沒有直接的 routing 關聯欄位
- ⚠️ Components（BOM Lines）可能需要從其他端點或子資源取得
- ⚠️ 需要檢查是否可以透過 `bomcomponent` record type 查詢 components

---

## 17. Work Center（工作中心）

### ⚠️ 問題

- **SuiteQL 中顯示 "Invalid search type: workcenter"**
- **REST API 測試結果**：所有可能的 record type 名稱都失敗：
  - `workcenter` - Record type does not exist
  - `workcenteritem` - Record type does not exist
  - `manufacturingworkcenter` - Record type does not exist
  - `productionworkcenter` - Record type does not exist

### 📝 重要發現（根據 NetSuite UI 截圖）

**Work Center 的實際實作方式**：
根據 NetSuite UI 截圖發現：
1. **Work Center 是透過 Employee Group 實現的**
   - 在 NetSuite UI 中：`Lists > Employee Groups`
   - 有一個 "Manufacturing Work Center" 的 checkbox
   - 當這個 checkbox 被勾選時，該 Employee Group 就成為一個 Work Center
   - 例如："Packing Machine Group" 被標記為 Manufacturing Work Center（ID: 2266）

2. **Work Center 在 Routing 中的使用**
   - 在 Manufacturing Routing 的 "Routing Steps" 中
   - 有一個 "Manufacturing Work Center" 欄位（必填）
   - 這個欄位選擇的是 Employee Group（已標記為 Work Center 的群組）
   - 例如："Packin" 是一個 Work Center

3. **Work Center 的設定**
   - Employee Group 有一個 "Manufacturing Work Center Settings" 標籤頁
   - 可能包含 Work Center 的詳細設定（產能、資源等）

### 📝 結論

**Work Center 的 REST API 存取方式**：
- ❌ **不存在獨立的 Work Center record type**
- ✅ **Work Center 是 Employee Group 的一種特殊類型**
- ⚠️ **但 `employeegroup`、`group`、`crmgroup` 等 record types 都不存在於 REST API 中**

**可能的原因**：
1. Employee Group 可能使用不同的 record type 名稱（尚未找到正確的名稱）
2. 或需要特定的權限才能存取
3. 或只能透過 SuiteScript 存取

**實際測試結果**（權限開啟後）：
- ✅ **可以透過 Manufacturing Routing 取得 Work Center 資訊**
- ✅ **從 Routing Steps 中可以取得 Work Center 的 ID 和名稱**
- ❌ **無法直接查詢 Employee Group**（`employeegroup` record type 不存在）

**Work Center 的實際資料結構**（從 Routing Steps 中取得）：
```typescript
{
  manufacturingWorkCenter: {
    id: "2266",
    refName: "Packing Machine Group"  // Employee Group 的名稱
  }
}
```

**建議**：
1. **透過 Manufacturing Routing 來取得 Work Center 資訊**（已確認可行）：
   ```typescript
   // 查詢 Routing Steps
   const routingSteps = await netsuite.request(
     `/services/rest/record/v1/manufacturingrouting/${routingId}/routingstep`,
     'GET'
   );
   
   // 取得每個 Step 的詳細資訊
   for (const step of routingSteps.items) {
     const stepDetail = await netsuite.request(
       `/services/rest/record/v1/manufacturingrouting/${routingId}/routingStep/${stepId}`,
       'GET'
     );
     
     // 從 stepDetail.manufacturingWorkCenter 取得 Work Center 資訊
     const workCenterId = stepDetail.manufacturingWorkCenter.id;
     const workCenterName = stepDetail.manufacturingWorkCenter.refName;
   }
   ```

2. **Work Center 資料表設計**：
   - 可以建立一個 Work Center 表，但資料來源是 Routing Steps
   - 欄位包括：`id`（Employee Group ID）、`name`（Employee Group 名稱）
   - 可以透過去重複來取得所有唯一的 Work Centers

3. **如果不需要 Work Center 的詳細資訊**：
   - 可以考慮跳過此表
   - 或只在需要時透過 Routing Steps 關聯取得

---

## 18. Routing（製程路由）

### ⚠️ 問題

- **REST API 測試結果**：
  - ✅ `manufacturingrouting` 在 metadata catalog 中存在
  - ✅ metadata schema 可以取得
  - ❌ **但 SuiteQL 查詢失敗**：`Record 'manufacturingrouting' was not found`
  - ❌ **REST API List 查詢失敗**：`Record 'manufacturingrouting' was not found`
  - ❌ 其他可能的 record type 名稱也都失敗

### 📝 發現

根據 NetSuite UI 顯示：
- **Record Type ID**: `ManufacturingRouting`
- **支援**: "SuiteScript and REST Query API"
- **主要欄位**：
  - `id` - Internal ID
  - `name` - Name
  - `billOfMaterials` - Bill of Materials (INTEGER, N:1 join to BOM)
  - `routingComponent` - Components (N/A, 1:N join)
  - `routingStep` - Routing Steps (N/A, 1:N join)
  - `location` - Locations (N/A, N:M join)
  - `subsidiary` - Subsidiary (INTEGER, N:1 join)
  - `memo` - Memo
  - `isDefault` - Default (BOOLEAN)
  - `isInactive` - Is Inactive (BOOLEAN)

### 📝 結論

**Routing 的奇怪狀況**：
- ✅ metadata catalog 中可以找到 `manufacturingrouting`
- ✅ metadata schema 可以取得
- ❌ 但 SuiteQL 和 REST API List 都無法查詢
- ❌ 錯誤訊息：`Record 'manufacturingrouting' was not found`

**實際測試結果**（建立測試 Routing "AAA Routing" ID: 1，權限開啟後）：
- ✅ **SuiteQL 查詢成功**：可以查詢到 Routing 資料
- ✅ **REST API List 查詢成功**：可以查詢到 1 個 Routing
- ✅ **使用 `getRecord('manufacturingrouting', '1')` 查詢單一記錄成功**
- ✅ **Routing Steps 查詢成功**：可以透過 `/routingstep` 子資源查詢
- ✅ **Work Center 資訊取得成功**：從 Routing Steps 中可以取得 Work Center 資訊

**重要發現**：
1. ✅ **Routing 記錄類型確實存在** - 可以使用 REST API 查詢
2. ✅ **需要權限**：`Lists -> Manufacturing Routing` 權限（已開啟）
3. ✅ **可以查詢列表和單一記錄**
4. ✅ **可以透過子資源查詢 Routing Steps**
5. ✅ **可以從 Routing Steps 中取得 Work Center 資訊**

**結論**：
- ✅ Manufacturing Routing 可以透過 REST API 查詢（權限已開啟）
- ✅ 可以使用 `getRecordList('manufacturingrouting')` 查詢列表
- ✅ 可以使用 `getRecord('manufacturingrouting', routingId)` 查詢單一記錄
- ✅ 可以使用 SuiteQL 查詢 Routing
- ✅ 可以透過子資源 `/routingstep` 查詢 Routing Steps
- ✅ 可以從 Routing Steps 中取得 Work Center 資訊

**實際欄位結構**（根據測試結果 - AAA Routing ID: 1）：

**Manufacturing Routing 主記錄**：
```typescript
{
  id: "1",
  name: "AAA Routing",
  billOfMaterials: {
    id: "1",
    refName: "AAA BOM"
  },
  subsidiary: {
    id: "11",
    refName: "HEADQUARTERS"
  },
  location: { links: [...] },
  isDefault: false,
  isInactive: false,
  autoCalculateLag: false,
  routingStep: { links: [...] },  // 子資源連結
  routingComponent: { links: [...] },  // 子資源連結
}
```

**Routing Steps（透過子資源查詢）**：
```typescript
// 查詢方式：GET /services/rest/record/v1/manufacturingrouting/1/routingstep
// 每個 Step 的詳細資訊：GET /services/rest/record/v1/manufacturingrouting/1/routingStep/1
{
  operationSequence: 1,
  operationName: "1",
  manufacturingWorkCenter: {
    id: "2266",
    refName: "Packing Machine Group"  // 這就是 Work Center！
  },
  machineResources: 1,
  laborResources: 1,
  manufacturingCostTemplate: {
    id: "1",
    refName: "Manufacturing Cost Template 01"
  },
  setupTime: 0,
  runRate: 0,
  operationYield: 100
}
```

**實作方式**：
```typescript
// 1. 查詢所有 Routing
const routingList = await netsuite.getRecordList('manufacturingrouting', { fetchAll: true });

// 2. 對每個 Routing，取得 Routing Steps
for (const routing of routingList.items) {
  const routingSteps = await netsuite.request(
    `/services/rest/record/v1/manufacturingrouting/${routing.id}/routingstep`,
    'GET'
  );
  
  // 3. 對每個 Step，取得詳細資訊（包含 Work Center）
  for (const step of routingSteps.items) {
    const stepId = step.links[0].href.match(/routingStep\/(\d+)/)?.[1];
    const stepDetail = await netsuite.request(
      `/services/rest/record/v1/manufacturingrouting/${routing.id}/routingStep/${stepId}`,
      'GET'
    );
    
    // 4. 從 stepDetail.manufacturingWorkCenter 取得 Work Center 資訊
    const workCenter = stepDetail.manufacturingWorkCenter;
    // workCenter.id = "2266"
    // workCenter.refName = "Packing Machine Group"
  }
}
```

**注意事項**：
- ✅ 已確認可以透過 REST API 查詢 Manufacturing Routing
- ✅ 已確認可以透過子資源查詢 Routing Steps
- ✅ 已確認可以從 Routing Steps 中取得 Work Center 資訊
- ⚠️ Work Center 是透過 Employee Group 實現的（ID: 2266），但無法直接查詢 Employee Group
- ⚠️ 需要 `Lists -> Manufacturing Routing` 權限才能查詢

---

## 📋 總結：主要差異

### 1. Subsidiary 欄位格式
- ✅ `subsidiary` 在 Department、Class、Location 中是**字串列表**（如 "1, 3, 4"）
- ❌ 不是單一 INTEGER

### 2. Account 欄位名稱
- ❌ `acctnumber` 和 `acctname` **不存在**
- ✅ 實際是 `accountsearchdisplayname` 和 `displaynamewithhierarchy`

### 3. Customer/Vendor 無 Subsidiary
- ❌ `subsidiary` 欄位**不存在**
- 需要透過其他方式關聯

### 4. Tax Code 和 Ship Method
- ✅ 使用 `itemid` 而不是 `name`

### 5. Expense Category
- ✅ 使用 `expenseacct` 而不是 `account`

### 6. SuiteQL 不支援的表
- ❌ `accountingperiod` - **必須使用 REST API**
  - ✅ 已確認可透過 REST API 取得（使用 List API）
  - ⚠️ 欄位名稱注意：`closed`（不是 `isClosed`），且 `isAdjustment` 不存在
- ❌ `bom` - **必須使用 REST API**
  - ✅ 已確認可透過 REST API 取得（製造模組啟用後，使用 List API）
  - ⚠️ 目前系統中沒有資料（需要先建立 Assembly Items 和 BOM）
- ⚠️ `workcenter` - **REST API 不可用**
  - ❌ REST API 中不存在此 record type
  - 可能需要使用 SuiteScript 或 SOAP API
- ⚠️ `routing` - **REST API 不可用**
  - ❌ REST API 中不存在此 record type
  - 可能需要使用 SuiteScript 或 SOAP API

---

## 🔄 MES 系統寫入 Work Center、Routing 和工時記錄的可行性

### Work Center（工作中心）

**結論**：
- ❌ **無法直接寫入 Work Center**（Work Center 是 Employee Group，record type 不存在於 REST API）
- ✅ **可以讀取 Work Center 資訊**（透過 Routing Steps）
- ✅ **Work Center 需要在 NetSuite UI 中手動建立**

**建議**：
- Work Center 作為「主檔資料」，在 NetSuite UI 中手動建立
- MES 系統只需從中台查詢 Work Center ID，不需要寫入

### Routing（製程路由）

**結論**：
- ✅ **可以查詢 Routing**（權限已開啟）
- ❌ **無法建立/更新 Routing**（測試失敗：location 欄位格式錯誤）
- ✅ **Routing 需要在 NetSuite UI 中手動建立**

**建議**：
- Routing 作為「主檔資料」，在 NetSuite UI 中手動建立
- MES 系統只需從中台查詢 Routing ID，不需要寫入

### 工時記錄（Time Tracking）

**結論**：
- ✅ **Work Order Completion 可以建立**（已在指南中確認）
- ⚠️ **需要確認是否支援工時欄位**（laborHours, machineHours）
- ❌ **Time Bill 不支援 Work Order 關聯**（測試結果：沒有 workOrder 欄位）

**建議**：
- **透過 Work Order Completion 記錄工時**（推薦）
- 如果 Work Order Completion 支援工時欄位，可以直接記錄
- 如果不支援，可以透過 memo 欄位記錄工時資訊
- Work Center 資訊可以從 Routing Steps 取得，記錄在 memo 中

**詳細分析請參考**：`MES工時記錄完整分析.md`

---

## 🔄 下一步行動

1. ✅ 更新 Supabase 表結構，修正欄位名稱
2. ✅ 修正 N8N Workflow 中的 SuiteQL 查詢語句
3. ✅ 處理無法用 SuiteQL 查詢的表（使用 REST API）
4. ⚠️ 處理 `subsidiary` 字串列表的解析邏輯
5. ⚠️ 測試 Work Order Completion 是否支援工時欄位
6. ⚠️ 實作 MES 工時記錄 API

