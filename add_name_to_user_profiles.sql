-- ============================================
-- 為 user_profiles 表添加 name 欄位
-- 用途：儲存使用者姓名，與 user_metadata.full_name 同步
-- 執行方式：在 Supabase SQL Editor 中執行
-- ============================================

-- 檢查欄位是否存在，如果不存在則添加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN name VARCHAR(255);
        
        COMMENT ON COLUMN user_profiles.name IS '使用者姓名（與 user_metadata.full_name 同步）';
    END IF;
END $$;

