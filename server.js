#!/usr/bin/env node

// Standalone 模式啟動腳本
// 確保正確的工作目錄和環境變數

const { spawn } = require('child_process');
const path = require('path');

const standalonePath = path.join(__dirname, '.next', 'standalone', 'server.js');

// 處理 PORT 環境變數（Zeabur 會自動設置 PORT 或 WEB_PORT）
// 優先順序：PORT > WEB_PORT > 3000
let port = process.env.PORT || process.env.WEB_PORT || '3000';

// 如果 PORT 包含變數引用格式（如 ${WEB_PORT}），嘗試解析
if (typeof port === 'string' && port.includes('$')) {
  // 嘗試從實際的 WEB_PORT 環境變數獲取
  port = process.env.WEB_PORT || '3000';
  console.warn('PORT contains variable reference, using WEB_PORT instead:', port);
}

// 確保 port 是數字字串
port = String(port).trim();

console.log('Starting Next.js standalone server...');
console.log('Standalone path:', standalonePath);
console.log('Container working directory:', path.join(__dirname, '.next', 'standalone'));
console.log('Using PORT:', port);
console.log('All PORT-related env vars:', {
  PORT: process.env.PORT,
  WEB_PORT: process.env.WEB_PORT,
  NODE_ENV: process.env.NODE_ENV,
});

const server = spawn('node', [standalonePath], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: port,
    WEB_PORT: port,
  },
  stdio: 'inherit',
  cwd: path.join(__dirname, '.next', 'standalone'),
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code || 0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.kill('SIGINT');
});

