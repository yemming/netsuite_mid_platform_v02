const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 讀取環境變數
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('請設定環境變數：');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('或使用 Supabase MCP 工具直接執行 SQL 檔案');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeBatch(batchNumber) {
  const batchFile = path.join(process.cwd(), 'scripts', `pos-sales-batch-${batchNumber}.sql`);
  
  if (!fs.existsSync(batchFile)) {
    console.error(`批次檔案不存在: ${batchFile}`);
    return false;
  }
  
  const sql = fs.readFileSync(batchFile, 'utf-8').trim();
  
  if (!sql) {
    console.warn(`批次 ${batchNumber} 為空，跳過`);
    return false;
  }
  
  try {
    // 使用 Supabase REST API 執行 SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // 如果 RPC 不存在，嘗試直接使用 execute_sql
      console.log(`批次 ${batchNumber}: 嘗試使用 execute_sql...`);
      // 這裡需要使用 Supabase MCP 工具
      console.log(`請使用 Supabase MCP 的 execute_sql 工具執行: scripts/pos-sales-batch-${batchNumber}.sql`);
      return false;
    }
    
    console.log(`✓ 批次 ${batchNumber} 執行成功`);
    return true;
  } catch (error) {
    console.error(`批次 ${batchNumber} 執行錯誤:`, error.message);
    return false;
  }
}

async function importRemainingBatches() {
  console.log('準備執行剩餘批次 (3-10)...');
  console.log('注意：由於 Supabase JS 客戶端不支援直接執行 SQL，');
  console.log('請使用 Supabase MCP 的 execute_sql 工具來執行這些批次。');
  console.log('');
  
  for (let i = 3; i <= 10; i++) {
    const batchFile = path.join(process.cwd(), 'scripts', `pos-sales-batch-${i}.sql`);
    if (fs.existsSync(batchFile)) {
      const lineCount = fs.readFileSync(batchFile, 'utf-8').split('\n').length;
      console.log(`批次 ${i}: ${batchFile} (${lineCount} 行)`);
    }
  }
  
  console.log('');
  console.log('請使用 Supabase MCP 的 execute_sql 工具來執行這些批次。');
}

importRemainingBatches().catch(console.error);







