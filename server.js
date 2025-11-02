#!/usr/bin/env node

// Standalone 模式啟動腳本
// 直接載入並運行 Next.js standalone server

const path = require('path');

// 處理 PORT 環境變數
let port = process.env.PORT || process.env.WEB_PORT || '3000';
if (typeof port === 'string' && port.includes('$')) {
  port = process.env.WEB_PORT || '3000';
}
port = String(port).trim();

// 設置環境變數
process.env.PORT = port;
process.env.WEB_PORT = port;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

console.log('Starting Next.js standalone server...');
console.log('Using PORT:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);

// 切換到 standalone 目錄（Next.js 要求）
const standaloneDir = path.join(__dirname, '.next', 'standalone');
process.chdir(standaloneDir);

// 直接載入並運行 Next.js server
try {
  require('./server.js');
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}

