-- ============================================
-- 表映射配置表（table_mapping_config）
-- 用途：動態管理 NetSuite 表到 Supabase 表的映射關係
-- 建立時間：2025-01-XX
-- ============================================

CREATE TABLE IF NOT EXISTS table_mapping_config (
  -- 主鍵
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 映射鍵（唯一識別符，對應程式碼中的 key）
  mapping_key VARCHAR(100) UNIQUE NOT NULL,
  
  -- NetSuite SuiteQL 表名
  netsuite_table VARCHAR(100) NOT NULL,
  
  -- Supabase 表名（可以是 ns_xxx 或 <accountid>_xxx）
  supabase_table_name VARCHAR(100) NOT NULL,
  
  -- 中文標籤
  label VARCHAR(100) NOT NULL,
  
  -- 優先級
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('🔴 最高', '🔴 高', '🟡 中', '🟢 低')),
  
  -- API 路由路徑
  api_route VARCHAR(200) NOT NULL,
  
  -- 衝突處理欄位（用於 Upsert）
  conflict_column VARCHAR(100) NOT NULL,
  
  -- 依賴的表（陣列格式，例如：['subsidiaries']）
  depends_on TEXT[] DEFAULT '{}',
  
  -- 同步順序（用於排序）
  sync_order INTEGER,
  
  -- 是否啟用
  is_enabled BOOLEAN DEFAULT TRUE,
  
  -- 停用原因
  disabled_reason TEXT,
  
  -- 審計欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_table_mapping_config_enabled ON table_mapping_config(is_enabled, sync_order);
CREATE INDEX IF NOT EXISTS idx_table_mapping_config_key ON table_mapping_config(mapping_key);
CREATE INDEX IF NOT EXISTS idx_table_mapping_config_table_name ON table_mapping_config(supabase_table_name);
CREATE INDEX IF NOT EXISTS idx_table_mapping_config_api_route ON table_mapping_config(api_route);

-- 註解
COMMENT ON TABLE table_mapping_config IS '表映射配置表：管理 NetSuite 表到 Supabase 表的映射關係';
COMMENT ON COLUMN table_mapping_config.mapping_key IS '映射鍵（唯一識別符，例如：subsidiaries, currencies）';
COMMENT ON COLUMN table_mapping_config.netsuite_table IS 'NetSuite SuiteQL 表名（例如：subsidiary, currency）';
COMMENT ON COLUMN table_mapping_config.supabase_table_name IS 'Supabase 表名（例如：ns_subsidiaries 或 td3018275_subsidiaries）';
COMMENT ON COLUMN table_mapping_config.priority IS '優先級：🔴 最高、🔴 高、🟡 中、🟢 低';
COMMENT ON COLUMN table_mapping_config.depends_on IS '依賴的表（陣列格式，例如：["subsidiaries"]）';
COMMENT ON COLUMN table_mapping_config.sync_order IS '同步順序（數字越小越優先）';

