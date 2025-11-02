#!/usr/bin/env node

// Standalone 模式啟動腳本
// 直接載入並運行 Next.js standalone server

const path = require('path');
const fs = require('fs');

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
console.log('Current working directory:', process.cwd());

// 檢查並切換到 standalone 目錄（Next.js 要求）
const standaloneDir = path.join(__dirname, '.next', 'standalone');
const standaloneServerPath = path.join(standaloneDir, 'server.js');

console.log('Standalone directory:', standaloneDir);
console.log('Standalone server path:', standaloneServerPath);

// 檢查目錄和文件是否存在
if (!fs.existsSync(standaloneDir)) {
  console.error(`ERROR: Standalone directory not found: ${standaloneDir}`);
  console.error('Please make sure you have run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(standaloneServerPath)) {
  console.error(`ERROR: Standalone server file not found: ${standaloneServerPath}`);
  console.error('Please make sure you have run "npm run build" first.');
  process.exit(1);
}

// 切換到 standalone 目錄（Next.js 要求）
try {
  process.chdir(standaloneDir);
  console.log('Changed working directory to:', process.cwd());
} catch (error) {
  console.error('Failed to change directory:', error);
  process.exit(1);
}

// 直接載入並運行 Next.js server
try {
  console.log('Loading Next.js standalone server...');
  require('./server.js');
  console.log('Next.js server loaded successfully');
} catch (error) {
  console.error('Failed to start server:', error);
  console.error('Error stack:', error.stack);
  process.exit(1);
}

