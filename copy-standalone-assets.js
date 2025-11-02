#!/usr/bin/env node

/**
 * 構建後腳本：確保 Next.js standalone 模式的靜態資源被正確複製
 * 
 * Next.js standalone 模式會自動複製一些文件，但我們需要確保：
 * 1. .next/static 被複製到 .next/standalone/.next/static
 * 2. public 目錄被複製到 .next/standalone/public
 */

const fs = require('fs');
const path = require('path');

const srcStaticDir = path.join(__dirname, '.next', 'static');
const destStaticDir = path.join(__dirname, '.next', 'standalone', '.next', 'static');

const srcPublicDir = path.join(__dirname, 'public');
const destPublicDir = path.join(__dirname, '.next', 'standalone', 'public');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`Source directory does not exist: ${src}`);
    return;
  }

  // 創建目標目錄
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // 遞歸複製文件
  function copyRecursive(srcDir, destDir) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyRecursive(src, dest);
  console.log(`✅ Copied ${src} to ${dest}`);
}

console.log('📦 Copying standalone assets...');

// 複製靜態資源
if (fs.existsSync(srcStaticDir)) {
  copyDir(srcStaticDir, destStaticDir);
} else {
  console.warn(`⚠️  Static directory not found: ${srcStaticDir}`);
}

// 複製 public 目錄（如果存在）
if (fs.existsSync(srcPublicDir)) {
  copyDir(srcPublicDir, destPublicDir);
} else {
  console.log(`ℹ️  Public directory not found: ${srcPublicDir} (this is OK if you don't have public assets)`);
}

console.log('✅ Standalone assets copy complete!');

