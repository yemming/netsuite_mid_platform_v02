#!/bin/bash

# NetSuite MCP 認證測試腳本
# 用途：手動觸發 NetSuite MCP 認證流程

echo "🔍 NetSuite MCP 認證測試"
echo "========================"
echo ""

# 檢查端口
echo "1. 檢查端口 8080 狀態..."
if lsof -i :8080 > /dev/null 2>&1; then
    echo "   ⚠️  端口 8080 已被占用："
    lsof -i :8080 | head -3
    echo ""
    read -p "   是否要繼續？(y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "   已取消"
        exit 1
    fi
else
    echo "   ✅ 端口 8080 可用"
fi

echo ""
echo "2. 啟動 NetSuite MCP 認證流程..."
echo "   （按 Ctrl+C 可以停止）"
echo ""

# 啟動 NetSuite MCP
npx -y @suiteinsider/netsuite-mcp@latest


