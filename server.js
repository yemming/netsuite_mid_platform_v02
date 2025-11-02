#!/usr/bin/env node

// Standalone 模式啟動腳本
// 直接載入並運行 Next.js standalone server

const path = require('path');
const fs = require('fs');

// 全局錯誤處理：捕獲未處理的錯誤，記錄但不立即退出
// 這樣可以幫助診斷問題，同時不會阻止服務器運行
let isExiting = false;

process.on('uncaughtException', (error) => {
  console.error('========================================');
  console.error('UNCAUGHT EXCEPTION - This will cause process exit');
  console.error('========================================');
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  console.error('========================================');
  
  // 記錄詳細錯誤信息後，允許進程退出
  // 這樣我們可以看到實際的錯誤原因
  // 延遲一點時間確保日誌被寫入
  setTimeout(() => {
    if (!isExiting) {
      process.exit(1);
    }
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  
  // 記錄未處理的 Promise rejection
  // 但不要立即退出，讓服務器繼續運行
});

// 優雅關閉處理
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  isExiting = true;
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  isExiting = true;
  process.exit(0);
});

// 監聽進程退出事件
process.on('exit', (code) => {
  console.log(`Process exiting with code: ${code}`);
});

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
  
  // 載入 Next.js standalone server
  const nextServer = require('./server.js');
  
  console.log('Next.js server loaded successfully');
  console.log('Server module type:', typeof nextServer);
  console.log('Server module keys:', nextServer ? Object.keys(nextServer) : 'null');
  
  // 確保進程不會退出
  // Next.js server 應該已經開始監聽端口
  // 如果沒有，我們需要確保進程保持運行
  
  // 記錄服務器狀態
  console.log('Next.js standalone server is running...');
  console.log('Listening on PORT:', port);
  
  // 添加一個保持進程運行的機制
  // 如果服務器沒有正確啟動，這裡會幫助診斷
  setTimeout(() => {
    console.log('Server health check: Still running after 3 seconds');
  }, 3000);
  
} catch (error) {
  console.error('Failed to start server:', error);
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  process.exit(1);
}

