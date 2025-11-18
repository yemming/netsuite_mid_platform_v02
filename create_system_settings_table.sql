-- ============================================
-- 系統設定表（system_settings）
-- 用途：儲存系統各種設定值，如 N8N Webhook URL 等
-- 建立時間：2025-01-XX
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
  -- 主鍵
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 設定鍵（唯一識別符）
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  
  -- 設定值
  setting_value TEXT,
  
  -- 設定說明
  description TEXT,
  
  -- 設定類型（用於前端表單驗證）
  setting_type VARCHAR(50) DEFAULT 'text' CHECK (setting_type IN ('text', 'url', 'number', 'boolean', 'json')),
  
  -- 是否為敏感資訊（需要特殊處理）
  is_sensitive BOOLEAN DEFAULT FALSE,
  
  -- 審計欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- 註解
COMMENT ON TABLE system_settings IS '系統設定表：儲存系統各種設定值';
COMMENT ON COLUMN system_settings.setting_key IS '設定鍵（唯一識別符，例如：n8n_webhook_url_ocr）';
COMMENT ON COLUMN system_settings.setting_value IS '設定值';
COMMENT ON COLUMN system_settings.description IS '設定說明';
COMMENT ON COLUMN system_settings.setting_type IS '設定類型（text, url, number, boolean, json）';
COMMENT ON COLUMN system_settings.is_sensitive IS '是否為敏感資訊';

-- 插入預設的 N8N Webhook URL 設定
INSERT INTO system_settings (setting_key, setting_value, description, setting_type, is_sensitive)
VALUES (
  'n8n_webhook_url_ocr',
  'https://yemming-n8n.zeabur.app/webhook/4a25ebee-21a3-46bf-a2db-7f704424b317',
  'N8N OCR Webhook URL（用於 NetSuite 催款 Email OCR 處理）',
  'url',
  FALSE
)
ON CONFLICT (setting_key) DO NOTHING;

