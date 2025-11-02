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
  // 這會自動啟動 HTTP 服務器並開始監聽端口
  require('./server.js');
  
  console.log('Next.js server loaded successfully');
  console.log('Server should be listening on PORT:', port);
  
  // Next.js standalone server 應該已經開始監聽端口
  // 它會自動保持事件循環運行
  // 添加健康檢查日誌來確認服務器運行狀態
  
  // 定期輸出健康檢查日誌，確保進程持續運行
  let healthCheckInterval = setInterval(() => {
    const uptime = Math.floor(process.uptime());
    console.log(`[Health Check] Server is running (uptime: ${uptime}s, port: ${port})`);
    
    // 檢查事件循環是否活躍
    if (process.listenerCount('exit') === 0) {
      console.warn('[Warning] No exit listeners found');
    }
  }, 30000); // 每30秒輸出一次健康檢查
  
  // 確保在進程退出時清理間隔
  process.on('exit', () => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
    }
  });
  
  // 初始健康檢查（3秒後）
  setTimeout(() => {
    console.log('[Health Check] Server is still running after 3 seconds');
  }, 3000);
  
  // 10秒後再次檢查
  setTimeout(() => {
    console.log('[Health Check] Server is still running after 10 seconds');
  }, 10000);
  
  console.log('Next.js standalone server startup complete. Waiting for requests...');
  
} catch (error) {
  console.error('Failed to start server:', error);
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  process.exit(1);
}

