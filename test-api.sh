#!/bin/bash

echo "=========================================="
echo "測試 NetSuite Expense Report API"
echo "=========================================="
echo ""

# 執行測試
echo "正在發送測試請求..."
curl -X POST http://localhost:3000/api/test-expense-report-payload \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP 狀態碼: %{http_code}\n" \
  -s | python3 -m json.tool 2>/dev/null || echo "無法解析 JSON"

echo ""
echo "=========================================="
echo "請查看 Next.js 開發伺服器的終端機輸出"
echo "應該會看到 [NetSuite API] 開頭的詳細 log"
echo "=========================================="

