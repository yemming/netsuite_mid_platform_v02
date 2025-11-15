const fs = require('fs');
const path = require('path');

// 讀取所有批次檔案
const batchesDir = path.join(process.cwd(), 'scripts');
const batchFiles = [];

for (let i = 1; i <= 10; i++) {
  const batchFile = path.join(batchesDir, `pos-sales-batch-${i}.sql`);
  if (fs.existsSync(batchFile)) {
    batchFiles.push(batchFile);
  }
}

console.log(`找到 ${batchFiles.length} 個批次檔案`);
console.log('請使用 Supabase MCP 的 execute_sql 工具來執行這些批次。');
console.log('批次檔案列表：');
batchFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${path.basename(file)}`);
});







