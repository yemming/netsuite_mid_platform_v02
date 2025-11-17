-- ============================================
-- 欄位映射配置表（field_mapping_config）
-- 用途：管理 NetSuite 欄位到 Supabase 欄位的映射關係
-- 建立時間：2025-01-XX
-- ============================================

CREATE TABLE IF NOT EXISTS field_mapping_config (
  -- 主鍵
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 關聯到表映射
  table_mapping_id UUID REFERENCES table_mapping_config(id) ON DELETE CASCADE,
  mapping_key VARCHAR(100) NOT NULL,  -- 例如：'customers', 'subsidiaries'
  
  -- NetSuite 欄位資訊
  netsuite_field_name VARCHAR(100) NOT NULL,  -- 例如：'custbody_custom_field_1', 'isinactive'
  netsuite_field_type VARCHAR(50),  -- 'text', 'number', 'date', 'boolean', 'select', 'currency'
  netsuite_field_label VARCHAR(255),  -- 欄位顯示名稱（從 NetSuite Metadata 取得）
  
  -- Supabase 欄位資訊
  supabase_column_name VARCHAR(100) NOT NULL,  -- 例如：'custom_field_1', 'is_active'
  supabase_column_type VARCHAR(50),  -- 'text', 'integer', 'bigint', 'boolean', 'timestamp', 'numeric', 'jsonb'
  
  -- 轉換規則（JSONB 格式）
  transformation_rule JSONB DEFAULT '{}',  -- 例如：{"type": "boolean", "true_value": "T", "false_value": "F"}
  
  -- 狀態
  is_active BOOLEAN DEFAULT TRUE,  -- 是否啟用此映射
  is_custom_field BOOLEAN DEFAULT FALSE,  -- 是否為客制欄位（custbody_*, cseg_* 等）
  is_required BOOLEAN DEFAULT FALSE,  -- 是否為必填欄位
  
  -- 偵測資訊
  detected_at TIMESTAMPTZ,  -- 首次偵測到這個欄位的時間
  detected_by VARCHAR(100) DEFAULT 'schema_scanner',  -- 偵測來源：'schema_scanner', 'manual'
  
  -- 審計欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 唯一約束：同一個表的同一個 NetSuite 欄位只能有一個映射
  UNIQUE(mapping_key, netsuite_field_name)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_field_mapping_config_mapping_key ON field_mapping_config(mapping_key);
CREATE INDEX IF NOT EXISTS idx_field_mapping_config_table_mapping_id ON field_mapping_config(table_mapping_id);
CREATE INDEX IF NOT EXISTS idx_field_mapping_config_active ON field_mapping_config(mapping_key, is_active);
CREATE INDEX IF NOT EXISTS idx_field_mapping_config_custom_field ON field_mapping_config(is_custom_field, is_active);
CREATE INDEX IF NOT EXISTS idx_field_mapping_config_detected_at ON field_mapping_config(detected_at DESC);

-- 註解
COMMENT ON TABLE field_mapping_config IS '欄位映射配置表：管理 NetSuite 欄位到 Supabase 欄位的映射關係';
COMMENT ON COLUMN field_mapping_config.mapping_key IS '映射鍵（對應 table_mapping_config.mapping_key，例如：customers, subsidiaries）';
COMMENT ON COLUMN field_mapping_config.netsuite_field_name IS 'NetSuite 欄位名稱（例如：custbody_custom_field_1, isinactive）';
COMMENT ON COLUMN field_mapping_config.netsuite_field_type IS 'NetSuite 欄位型別（從 Metadata API 取得）';
COMMENT ON COLUMN field_mapping_config.supabase_column_name IS 'Supabase 欄位名稱（例如：custom_field_1, is_active）';
COMMENT ON COLUMN field_mapping_config.supabase_column_type IS 'Supabase 欄位型別（PostgreSQL 型別）';
COMMENT ON COLUMN field_mapping_config.transformation_rule IS '轉換規則（JSONB），例如：{"type": "boolean", "true_value": "T", "false_value": "F"}';
COMMENT ON COLUMN field_mapping_config.is_custom_field IS '是否為客制欄位（custbody_*, cseg_*, custcol_* 等）';
COMMENT ON COLUMN field_mapping_config.detected_at IS '首次偵測到這個欄位的時間（用於追蹤新欄位）';

-- 觸發器：自動更新 updated_at
CREATE OR REPLACE FUNCTION update_field_mapping_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_field_mapping_config_updated_at
  BEFORE UPDATE ON field_mapping_config
  FOR EACH ROW
  EXECUTE FUNCTION update_field_mapping_config_updated_at();

