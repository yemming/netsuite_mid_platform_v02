-- ============================================
-- 初始化公司別（Subsidiaries）欄位映射配置
-- 用途：為 field_mapping_config 表建立公司別的所有欄位映射
-- 執行方式：在 Supabase SQL Editor 中執行
-- ============================================

-- 先取得 table_mapping_config 中的 subsidiaries 記錄 ID
DO $$
DECLARE
  v_table_mapping_id UUID;
BEGIN
  -- 取得 subsidiaries 的 table_mapping_id
  SELECT id INTO v_table_mapping_id
  FROM table_mapping_config
  WHERE mapping_key = 'subsidiaries'
  LIMIT 1;

  IF v_table_mapping_id IS NULL THEN
    RAISE EXCEPTION '找不到 mapping_key = ''subsidiaries'' 的記錄，請先執行 migrate_table_mapping_to_config.sql';
  END IF;

  -- 插入公司別的所有欄位映射
  -- 使用 INSERT ... ON CONFLICT 避免重複插入
  INSERT INTO field_mapping_config (
    table_mapping_id,
    mapping_key,
    netsuite_field_name,
    netsuite_field_type,
    netsuite_field_label,
    supabase_column_name,
    supabase_column_type,
    transformation_rule,
    is_active,
    is_custom_field,
    is_required,
    detected_at,
    detected_by
  ) VALUES
  -- 主鍵欄位
  (
    v_table_mapping_id,
    'subsidiaries',
    'id',
    'integer',
    'Internal ID',
    'netsuite_internal_id',
    'integer',
    '{}',
    TRUE,
    FALSE,
    TRUE,
    NOW(),
    'manual'
  ),
  -- 基本資訊欄位
  (
    v_table_mapping_id,
    'subsidiaries',
    'name',
    'text',
    'Name',
    'name',
    'text',
    '{}',
    TRUE,
    FALSE,
    TRUE,
    NOW(),
    'manual'
  ),
  (
    v_table_mapping_id,
    'subsidiaries',
    'legalname',
    'text',
    'Legal Name',
    'legal_name',
    'text',
    '{}',
    TRUE,
    FALSE,
    FALSE,
    NOW(),
    'manual'
  ),
  (
    v_table_mapping_id,
    'subsidiaries',
    'fullname',
    'text',
    'Full Name',
    'full_name',
    'text',
    '{}',
    TRUE,
    FALSE,
    FALSE,
    NOW(),
    'manual'
  ),
  -- 地理位置欄位
  (
    v_table_mapping_id,
    'subsidiaries',
    'country',
    'text',
    'Country',
    'country',
    'text',
    '{}',
    TRUE,
    FALSE,
    FALSE,
    NOW(),
    'manual'
  ),
  (
    v_table_mapping_id,
    'subsidiaries',
    'state',
    'text',
    'State/Province',
    'state',
    'text',
    '{}',
    TRUE,
    FALSE,
    FALSE,
    NOW(),
    'manual'
  ),
  -- 關聯欄位（ID 轉換）
  (
    v_table_mapping_id,
    'subsidiaries',
    'currency',
    'integer',
    'Base Currency',
    'base_currency_id',
    'integer',
    '{}',
    TRUE,
    FALSE,
    FALSE,
    NOW(),
    'manual'
  ),
  (
    v_table_mapping_id,
    'subsidiaries',
    'parent',
    'integer',
    'Parent Subsidiary',
    'parent_id',
    'integer',
    '{}',
    TRUE,
    FALSE,
    FALSE,
    NOW(),
    'manual'
  ),
  (
    v_table_mapping_id,
    'subsidiaries',
    'fiscalcalendar',
    'integer',
    'Fiscal Calendar',
    'fiscal_calendar_id',
    'integer',
    '{}',
    TRUE,
    FALSE,
    FALSE,
    NOW(),
    'manual'
  ),
  -- 聯絡資訊
  (
    v_table_mapping_id,
    'subsidiaries',
    'email',
    'text',
    'Email',
    'email',
    'text',
    '{}',
    TRUE,
    FALSE,
    FALSE,
    NOW(),
    'manual'
  ),
  -- 布林值欄位（需要轉換規則）
  (
    v_table_mapping_id,
    'subsidiaries',
    'iselimination',
    'boolean',
    'Is Elimination',
    'is_elimination',
    'boolean',
    '{"type": "boolean", "true_value": "T", "false_value": "F"}',
    TRUE,
    FALSE,
    FALSE,
    NOW(),
    'manual'
  ),
  (
    v_table_mapping_id,
    'subsidiaries',
    'isinactive',
    'boolean',
    'Is Inactive',
    'is_active',
    'boolean',
    '{"type": "boolean_invert", "true_value": "F", "false_value": "T"}',
    TRUE,
    FALSE,
    FALSE,
    NOW(),
    'manual'
  )
  ON CONFLICT (mapping_key, netsuite_field_name) 
  DO UPDATE SET
    supabase_column_name = EXCLUDED.supabase_column_name,
    supabase_column_type = EXCLUDED.supabase_column_type,
    transformation_rule = EXCLUDED.transformation_rule,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  RAISE NOTICE '成功初始化公司別欄位映射配置，共 12 個欄位';
END $$;

-- 驗證資料
SELECT 
  fmc.netsuite_field_name AS "NetSuite 欄位",
  fmc.supabase_column_name AS "Supabase 欄位",
  fmc.supabase_column_type AS "型別",
  fmc.is_active AS "已啟用",
  CASE 
    WHEN fmc.transformation_rule::text != '{}' THEN '是'
    ELSE '否'
  END AS "需要轉換"
FROM field_mapping_config fmc
WHERE fmc.mapping_key = 'subsidiaries'
ORDER BY 
  CASE fmc.netsuite_field_name
    WHEN 'id' THEN 1
    WHEN 'name' THEN 2
    ELSE 3
  END,
  fmc.netsuite_field_name;

