-- ============================================
-- 建立取得表欄位資訊的函數
-- 用途：用於欄位映射管理頁面查詢 Supabase 表的欄位結構
-- ============================================

CREATE OR REPLACE FUNCTION get_table_columns(table_name_param TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT,
  ordinal_position INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    COALESCE(c.column_default::TEXT, '')::TEXT,
    c.ordinal_position::INTEGER
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = table_name_param
  ORDER BY c.ordinal_position;
END;
$$;

-- 註解
COMMENT ON FUNCTION get_table_columns IS '取得指定表的所有欄位資訊，用於欄位映射管理';

