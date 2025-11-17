-- ============================================
-- 檢查欄位映射配置狀態
-- 用途：查看目前 field_mapping_config 表的狀態
-- 執行方式：在 Supabase SQL Editor 中執行
-- ============================================

-- 1. 檢查表是否存在
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'field_mapping_config'
    ) THEN '✅ field_mapping_config 表已存在'
    ELSE '❌ field_mapping_config 表不存在，請先執行 create_field_mapping_config.sql'
  END AS "表狀態";

-- 2. 統計各表的欄位映射數量
SELECT 
  tmc.mapping_key AS "表映射鍵",
  tmc.label AS "表名稱",
  COUNT(fmc.id) AS "已配置欄位數",
  COUNT(CASE WHEN fmc.is_active THEN 1 END) AS "已啟用欄位數",
  COUNT(CASE WHEN NOT fmc.is_active THEN 1 END) AS "待確認欄位數"
FROM table_mapping_config tmc
LEFT JOIN field_mapping_config fmc ON tmc.mapping_key = fmc.mapping_key
WHERE tmc.is_enabled = TRUE
GROUP BY tmc.mapping_key, tmc.label, tmc.sync_order
ORDER BY tmc.sync_order;

-- 3. 檢查公司別（subsidiaries）的詳細狀態
SELECT 
  '公司別 (subsidiaries)' AS "表名",
  COUNT(*) AS "總欄位數",
  COUNT(CASE WHEN is_active THEN 1 END) AS "已啟用",
  COUNT(CASE WHEN NOT is_active THEN 1 END) AS "待確認",
  COUNT(CASE WHEN is_custom_field THEN 1 END) AS "客制欄位"
FROM field_mapping_config
WHERE mapping_key = 'subsidiaries';

-- 4. 列出公司別的所有欄位映射（如果有的話）
SELECT 
  fmc.netsuite_field_name AS "NetSuite 欄位",
  fmc.netsuite_field_type AS "NetSuite 型別",
  fmc.supabase_column_name AS "Supabase 欄位",
  fmc.supabase_column_type AS "Supabase 型別",
  CASE 
    WHEN fmc.is_active THEN '✅ 已啟用'
    ELSE '⏳ 待確認'
  END AS "狀態",
  CASE 
    WHEN fmc.is_custom_field THEN '是'
    ELSE '否'
  END AS "客制欄位",
  fmc.detected_at AS "偵測時間"
FROM field_mapping_config fmc
WHERE fmc.mapping_key = 'subsidiaries'
ORDER BY 
  CASE fmc.netsuite_field_name
    WHEN 'id' THEN 1
    WHEN 'name' THEN 2
    ELSE 3
  END,
  fmc.netsuite_field_name;

-- 5. 檢查是否有待確認的欄位（所有表）
SELECT 
  tmc.label AS "表名稱",
  fmc.netsuite_field_name AS "NetSuite 欄位",
  fmc.supabase_column_name AS "建議 Supabase 欄位",
  fmc.detected_at AS "偵測時間"
FROM field_mapping_config fmc
JOIN table_mapping_config tmc ON fmc.mapping_key = tmc.mapping_key
WHERE fmc.is_active = FALSE
ORDER BY fmc.detected_at DESC, tmc.sync_order;

