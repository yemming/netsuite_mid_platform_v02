const fs = require('fs');
const path = require('path');

// 讀取 SQL 檔案並按分號分割成批次
const sqlPath = path.join(process.cwd(), 'scripts', 'pos-sales-insert.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

// 按分號分割，但保留 INSERT 語句的完整性
const batches = sqlContent.split(';\n').filter(batch => batch.trim().length > 0);

console.log(`準備執行 ${batches.length} 個批次...`);

// 輸出 SQL 語句供手動執行或使用 MCP
batches.forEach((batch, index) => {
  const batchFile = path.join(process.cwd(), 'scripts', `pos-sales-batch-${index + 1}.sql`);
  fs.writeFileSync(batchFile, batch + ';', 'utf-8');
  console.log(`已生成批次 ${index + 1}: ${batchFile}`);
});

console.log(`\n已生成 ${batches.length} 個批次檔案。`);
console.log('請使用 Supabase MCP 的 execute_sql 工具來執行這些批次。');







