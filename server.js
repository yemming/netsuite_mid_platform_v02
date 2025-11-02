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
// Zeabur 配置：直接使用 8080 端口
// 優先順序：PORT 環境變數 > WEB_PORT 環境變數 > 默認 8080
let port = process.env.PORT || process.env.WEB_PORT || '8080';

// 如果 PORT 包含變數引用（如 ${WEB_PORT}），嘗試解析
if (port && typeof port === 'string' && port.includes('$')) {
  // 嘗試從 WEB_PORT 獲取實際值
  port = process.env.WEB_PORT || '8080';
  console.log('PORT contains variable reference, using WEB_PORT or default:', port);
}

// 確保 port 是有效的數字字符串
port = String(port).trim();

// 驗證端口號是否有效
const portNum = parseInt(port, 10);
if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
  console.error(`Invalid port number: ${port}, defaulting to 8080`);
  port = '8080';
}

// 最終確保使用 8080（Zeabur 配置要求）
if (process.env.NODE_ENV === 'production') {
  port = '8080';
  console.log('Production environment detected, forcing port to 8080');
}

// 設置環境變數（確保在載入 Next.js server 之前設置）
process.env.PORT = port;
process.env.WEB_PORT = port;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// 額外設置 Next.js 使用的端口環境變數
process.env.NEXT_PORT = port;

console.log('Starting Next.js standalone server...');
console.log('Using PORT:', port);
console.log('PORT environment variable:', process.env.PORT);
console.log('WEB_PORT environment variable:', process.env.WEB_PORT);
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
  console.log('========================================');
  console.log('Starting Next.js standalone server...');
  console.log('========================================');
  
  // 確保所有環境變數都設置好
  // Next.js standalone server 需要 PORT 環境變數
  console.log('Final environment check:');
  console.log('  PORT:', process.env.PORT);
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  Working directory:', process.cwd());
  console.log('========================================');
  
  // Next.js standalone server.js 是一個可執行腳本
  // 直接 require 它應該會執行並啟動 HTTP 服務器
  // 根據 Next.js 文檔，standalone server.js 會在 require 時自動啟動
  console.log('Requiring Next.js standalone server.js...');
  require('./server.js');
  
  console.log('========================================');
  console.log('Next.js standalone server script executed');
  console.log('If server started correctly, it should be listening on port', port);
  console.log('Waiting for server to initialize...');
  console.log('========================================');
  
  // 等待一小段時間讓服務器完全啟動
  setTimeout(() => {
    console.log('========================================');
    console.log('Server startup check (5 seconds after load)');
    console.log('Expected listening PORT:', port);
    console.log('Process uptime:', Math.floor(process.uptime()), 'seconds');
    console.log('Event loop active:', process._getActiveHandles().length, 'active handles');
    console.log('Event loop requests:', process._getActiveRequests().length, 'active requests');
    
    // 檢查是否有監聽的服務器
    const net = require('net');
    const testServer = net.createServer();
    testServer.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log('✅ Port', port, 'is in use (good - server is listening)');
      } else {
        console.log('⚠️ Port check error:', err.code);
      }
    });
    testServer.once('listening', () => {
      console.log('⚠️ Port', port, 'is NOT in use (server may not be listening)');
      testServer.close();
    });
    testServer.listen(port, () => {
      console.log('⚠️ Port', port, 'is available (server may not be listening)');
      testServer.close();
    });
    setTimeout(() => {
      testServer.close();
    }, 1000);
    
    console.log('========================================');
  }, 5000);
  
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
  console.error('========================================');
  console.error('FAILED TO START SERVER');
  console.error('========================================');
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  console.error('========================================');
  process.exit(1);
}

