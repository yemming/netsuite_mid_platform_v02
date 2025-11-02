#!/usr/bin/env node

// Standalone 模式啟動腳本
// 確保正確的工作目錄和環境變數

const { spawn } = require('child_process');
const path = require('path');

const standalonePath = path.join(__dirname, '.next', 'standalone', 'server.js');

// 處理 PORT 環境變數（支援 Zeabur 的 ${WEB_PORT} 格式）
let port = process.env.PORT || process.env.WEB_PORT || '3000';
// 如果 PORT 包含 ${WEB_PORT}，嘗試從環境中解析
if (port.includes('${WEB_PORT}')) {
  port = process.env.WEB_PORT || '3000';
}
// 移除任何 ${} 格式的變數引用
port = port.replace(/\$\{[^}]+\}/g, process.env.WEB_PORT || '3000');

console.log('Starting Next.js standalone server...');
console.log('Standalone path:', standalonePath);
console.log('Using PORT:', port);
console.log('Environment variables:', {
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

