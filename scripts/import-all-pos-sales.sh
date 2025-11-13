#!/bin/bash

# 這個腳本會讀取所有批次檔案並使用 Supabase MCP 執行
# 由於需要 Supabase MCP 工具，請在 Cursor 中使用 MCP 工具執行

echo "已生成 10 個批次 SQL 檔案"
echo "批次檔案位置：scripts/pos-sales-batch-*.sql"
echo ""
echo "請使用 Supabase MCP 的 execute_sql 工具來執行這些批次"
echo "或使用以下命令讀取檔案內容："
echo ""
for i in {1..10}; do
  if [ -f "scripts/pos-sales-batch-$i.sql" ]; then
    echo "批次 $i: scripts/pos-sales-batch-$i.sql"
  fi
done






