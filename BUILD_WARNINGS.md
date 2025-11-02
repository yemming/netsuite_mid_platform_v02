# 構建警告說明

## 概述

在構建過程中可能會看到一些黃色的警告訊息，這些警告**不會影響應用的功能或運行**，僅用於提醒開發者某些依賴項已棄用。

## 常見警告類型

### 1. ESLint 8.x 棄用警告

```
npm warn deprecated eslint@8.57.1: This version is no longer supported
```

**原因：**
- 專案使用 `eslint-config-next@14.2.33`，它依賴 ESLint 8.x
- Next.js 14 目前只支持 ESLint 8.x
- ESLint 9.x 需要 Next.js 15+ 才支持

**解決方案：**
- **當前：** 暫時忽略，不影響功能
- **未來：** 升級到 Next.js 15+ 後可自動解決

### 2. 間接依賴棄用警告

以下警告來自 ESLint 8.x 的依賴鏈：

- `rimraf@3.0.2` - 文件刪除工具（ESLint 的間接依賴）
- `inflight@1.0.6` - 非同步控制工具（已停止維護）
- `glob@7.2.3` - 文件匹配工具
- `@humanwhocodes/object-schema@2.0.3` - 已遷移到 `@eslint/object-schema`
- `@humanwhocodes/config-array@0.13.0` - 已遷移到 `@eslint/config-array`

**原因：**
- 這些是 ESLint 8.x 的間接依賴
- 隨著 ESLint 升級到 9.x，這些依賴也會更新

**解決方案：**
- 這些是自動管理的依賴，無需手動處理
- 升級到 ESLint 9.x 後會自動解決

### 3. npm --force 警告

```
npm warn using --force Recommended protections disabled
```

**原因：**
- Zeabur 構建環境可能使用 `npm install --force` 來確保安裝成功
- 這是一個構建環境的配置，不影響我們的代碼

**解決方案：**
- 這是構建環境的配置，無需處理

## 是否需要處理？

### ❌ 不需要立即處理

1. **不影響功能：** 這些警告不會影響應用運行
2. **不影響構建：** 構建過程仍然成功完成
3. **正常現象：** Next.js 14 + ESLint 8 的標準組合

### ✅ 未來升級路徑

當準備升級時：

1. **升級 Next.js：** 從 14.x 升級到 15+ 或 16+
2. **自動更新 ESLint：** Next.js 15+ 會使用 ESLint 9.x
3. **更新配置：** 如果需要，更新 ESLint 配置文件（如果有）

## 相關資源

- [ESLint 版本支持政策](https://eslint.org/version-support)
- [Next.js 14 文檔](https://nextjs.org/docs)
- [Next.js 15 升級指南](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)

## 總結

這些警告是**正常的開發依賴棄用提醒**，不會影響應用的生產運行。你可以：
- ✅ 安全地忽略這些警告
- ✅ 繼續正常開發和使用應用
- ✅ 等待 Next.js 自然升級時自動解決

