-- ============================================
-- 現場維運管理系統 - 人員資料表（field_operations_personnel）
-- 用途：儲存技術人員、調度員和管理員的資料
-- 建立時間：2025-01-XX
-- ============================================

CREATE TABLE IF NOT EXISTS field_operations_personnel (
  -- 主鍵
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 人員識別碼（唯一，例如：USER-001）
  personnel_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- 基本資訊
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- 角色：dispatcher（調度員）、technician（技術人員）、admin（管理員）
  role VARCHAR(20) NOT NULL CHECK (role IN ('dispatcher', 'technician', 'admin')),
  
  -- 技能列表（陣列格式，僅技術人員使用）
  skills TEXT[] DEFAULT '{}',
  
  -- 狀態：online（在線）、offline（離線）
  status VARCHAR(10) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
  
  -- 頭像 URL（可選）
  avatar TEXT,
  
  -- GPS 位置資訊（JSONB 格式）
  -- 結構：{ latitude: number, longitude: number, lastUpdated: string, address?: string }
  location JSONB,
  
  -- 審計欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_field_operations_personnel_personnel_id ON field_operations_personnel(personnel_id);
CREATE INDEX IF NOT EXISTS idx_field_operations_personnel_email ON field_operations_personnel(email);
CREATE INDEX IF NOT EXISTS idx_field_operations_personnel_role ON field_operations_personnel(role);
CREATE INDEX IF NOT EXISTS idx_field_operations_personnel_status ON field_operations_personnel(status);
CREATE INDEX IF NOT EXISTS idx_field_operations_personnel_location ON field_operations_personnel USING GIN (location);

-- 更新 updated_at 的觸發器函數
CREATE OR REPLACE FUNCTION update_field_operations_personnel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器
CREATE TRIGGER trigger_update_field_operations_personnel_updated_at
  BEFORE UPDATE ON field_operations_personnel
  FOR EACH ROW
  EXECUTE FUNCTION update_field_operations_personnel_updated_at();

-- 註解
COMMENT ON TABLE field_operations_personnel IS '現場維運管理系統 - 人員資料表：儲存技術人員、調度員和管理員的資料';
COMMENT ON COLUMN field_operations_personnel.personnel_id IS '人員識別碼（唯一，例如：USER-001）';
COMMENT ON COLUMN field_operations_personnel.name IS '人員姓名';
COMMENT ON COLUMN field_operations_personnel.email IS '電子郵件（唯一）';
COMMENT ON COLUMN field_operations_personnel.role IS '角色：dispatcher（調度員）、technician（技術人員）、admin（管理員）';
COMMENT ON COLUMN field_operations_personnel.skills IS '技能列表（陣列格式，僅技術人員使用）';
COMMENT ON COLUMN field_operations_personnel.status IS '狀態：online（在線）、offline（離線）';
COMMENT ON COLUMN field_operations_personnel.avatar IS '頭像 URL（可選）';
COMMENT ON COLUMN field_operations_personnel.location IS 'GPS 位置資訊（JSONB 格式）：{ latitude, longitude, lastUpdated, address? }';

-- ============================================
-- Row Level Security (RLS) 設定
-- ============================================

-- 啟用 RLS
ALTER TABLE field_operations_personnel ENABLE ROW LEVEL SECURITY;

-- 政策：所有已登入的使用者都可以查看所有人員資料
CREATE POLICY "允許已登入使用者查看所有人員資料"
  ON field_operations_personnel
  FOR SELECT
  TO authenticated
  USING (true);

-- 政策：所有已登入的使用者都可以新增人員（初始設定，之後可根據需求調整）
-- 注意：如果需要限制只有管理員可以新增，需要透過應用層邏輯或使用 service_role key
CREATE POLICY "允許已登入使用者新增人員"
  ON field_operations_personnel
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 政策：所有已登入的使用者都可以更新人員資料（初始設定，之後可根據需求調整）
-- 注意：如果需要限制只有管理員可以更新，需要透過應用層邏輯或使用 service_role key
CREATE POLICY "允許已登入使用者更新人員資料"
  ON field_operations_personnel
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 政策：所有已登入的使用者都可以刪除人員（初始設定，之後可根據需求調整）
-- 注意：如果需要限制只有管理員可以刪除，需要透過應用層邏輯或使用 service_role key
CREATE POLICY "允許已登入使用者刪除人員"
  ON field_operations_personnel
  FOR DELETE
  TO authenticated
  USING (true);

-- 插入範例資料（可選）
-- INSERT INTO field_operations_personnel (personnel_id, name, email, role, skills, status, location) VALUES
-- ('USER-001', '魯夫', 'luffy@example.com', 'technician', ARRAY['空調維修', '電氣系統'], 'online', 
--   '{"latitude": 25.0330, "longitude": 121.5654, "lastUpdated": "2025-01-XXT00:00:00Z", "address": "台北市信義區信義路五段"}'::jsonb),
-- ('USER-002', '索隆', 'zoro@example.com', 'technician', ARRAY['網路設備', '監控系統'], 'online',
--   '{"latitude": 25.0143, "longitude": 121.4637, "lastUpdated": "2025-01-XXT00:00:00Z", "address": "台北市大安區敦化南路"}'::jsonb),
-- ('USER-003', '香吉士', 'sanji@example.com', 'technician', ARRAY['智慧家電', '門禁系統'], 'offline', NULL),
-- ('USER-004', '娜美', 'nami@example.com', 'dispatcher', '{}', 'online',
--   '{"latitude": 25.0400, "longitude": 121.5700, "lastUpdated": "2025-01-XXT00:00:00Z", "address": "台北市信義區市府路"}'::jsonb),
-- ('USER-005', '羅賓', 'robin@example.com', 'admin', '{}', 'online',
--   '{"latitude": 25.0200, "longitude": 121.5400, "lastUpdated": "2025-01-XXT00:00:00Z", "address": "台北市中正區重慶南路"}'::jsonb);

