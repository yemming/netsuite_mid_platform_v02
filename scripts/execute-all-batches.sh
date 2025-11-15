#!/bin/bash

# 這個腳本會讀取所有批次檔案並使用 Supabase MCP 執行
# 由於需要環境變數，建議直接使用 Supabase MCP 工具執行

echo "已生成 10 個批次 SQL 檔案在 scripts/ 目錄下"
echo "請使用 Supabase MCP 的 execute_sql 工具來執行這些批次"
echo ""
echo "批次檔案："
for i in {1..10}; do
  if [ -f "scripts/pos-sales-batch-$i.sql" ]; then
    echo "  - pos-sales-batch-$i.sql"
  fi
done







