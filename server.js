#!/usr/bin/env node

// Standalone 模式啟動腳本
// 確保正確的工作目錄和環境變數

const { spawn } = require('child_process');
const path = require('path');

const standalonePath = path.join(__dirname, '.next', 'standalone', 'server.js');

console.log('Starting Next.js standalone server...');
console.log('Standalone path:', standalonePath);

const server = spawn('node', [standalonePath], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || '3000',
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

