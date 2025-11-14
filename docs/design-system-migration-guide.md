# 設計系統遷移指南

> **用途**: 將現有頁面遷移到 NetSuite Next UI 設計系統的指南

## 📋 遷移原則

### 顏色替換對照表

| 舊的類別 | 新的類別 | 說明 |
|---------|---------|------|
| `text-gray-900` | `text-foreground` | 主要文字顏色 |
| `text-gray-600` | `text-muted-foreground` | 次要文字顏色 |
| `text-gray-500` | `text-muted-foreground` | 次要文字顏色 |
| `text-gray-400` | `text-muted-foreground` | 次要文字顏色 |
| `dark:text-white` | `text-foreground` | 深色模式文字（已自動處理） |
| `dark:text-gray-300` | `text-foreground` | 深色模式文字 |
| `dark:text-gray-400` | `text-muted-foreground` | 深色模式次要文字 |
| `bg-white` | `bg-background` 或 `bg-card` | 背景顏色 |
| `bg-gray-50` | `bg-muted/50` | 淺色背景 |
| `bg-gray-100` | `bg-secondary` | 次要背景 |
| `bg-gray-200` | `bg-secondary` | 次要背景 |
| `dark:bg-[#28363F]` | `bg-background` | 深色模式背景（已自動處理） |
| `dark:bg-[#354a56]` | `bg-secondary` | 深色模式次要背景 |
| `border-gray-200` | `border-border` | 邊框顏色 |
| `dark:border-border` | `border-border` | 深色模式邊框（已自動處理） |
| `rounded` | `rounded-md` | 圓角（使用設計系統預設值） |

### 語義顏色

| 用途 | 類別 |
|------|------|
| 成功狀態 | `text-green-600 dark:text-green-500` |
| 警告狀態 | `text-orange-600 dark:text-orange-500` |
| 錯誤狀態 | `text-destructive` |
| 主要按鈕 | `bg-primary text-primary-foreground` |

## 🔄 遷移步驟

### 1. 文字顏色

**替換前:**
```tsx
<h1 className="text-3xl font-bold text-gray-900 dark:text-white">標題</h1>
<p className="text-gray-500 dark:text-gray-400">描述文字</p>
```

**替換後:**
```tsx
<h1 className="text-3xl font-bold text-foreground">標題</h1>
<p className="text-muted-foreground">描述文字</p>
```

### 2. 背景顏色

**替換前:**
```tsx
<div className="bg-white dark:bg-card border border-gray-200 dark:border-border">
```

**替換後:**
```tsx
<div className="bg-card border border-border">
```

### 3. 卡片樣式

**替換前:**
```tsx
<div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded p-5 shadow-sm">
```

**替換後:**
```tsx
<div className="bg-card border border-border rounded-md p-5 shadow-sm">
```

### 4. 按鈕樣式

**替換前:**
```tsx
<button className="px-4 py-2 bg-[#28363F] text-white rounded hover:bg-[#354a56]">
```

**替換後:**
```tsx
<button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
```

## 📝 批量替換腳本

可以使用以下正則表達式在編輯器中進行批量替換：

### VS Code / Cursor 批量替換

1. 開啟搜尋替換（Cmd+Shift+H / Ctrl+Shift+H）
2. 啟用正則表達式模式（.* 按鈕）

**替換規則:**

| 搜尋 | 替換為 | 說明 |
|------|--------|------|
| `text-gray-900 dark:text-white` | `text-foreground` | 主要文字 |
| `text-gray-600 dark:text-gray-400` | `text-muted-foreground` | 次要文字 |
| `text-gray-500 dark:text-gray-400` | `text-muted-foreground` | 次要文字 |
| `bg-white dark:bg-card` | `bg-card` | 卡片背景 |
| `bg-white dark:bg-background` | `bg-background` | 頁面背景 |
| `border-gray-200 dark:border-border` | `border-border` | 邊框 |
| `rounded` | `rounded-md` | 圓角（注意：只在卡片/按鈕上替換） |
| `bg-gray-50 dark:bg-\[#28363F\]` | `bg-muted/50` | 淺色背景 |
| `bg-gray-100 dark:bg-\[#354a56\]` | `bg-secondary` | 次要背景 |

## ⚠️ 注意事項

1. **不要替換語義顏色**: 成功（綠色）、警告（橙色）、錯誤（紅色）等語義顏色保持原樣，或使用設計系統的語義變數
2. **圓角替換要謹慎**: 只在需要統一圓角的地方替換 `rounded` 為 `rounded-md`
3. **測試深色模式**: 每次替換後都要測試深色模式是否正常顯示
4. **保留特殊樣式**: 如果某些元素有特殊的設計需求，可以保留原樣

## ✅ 已完成的頁面

- ✅ `app/dashboard/page.tsx` - 主儀表板
- ✅ `app/dashboard/layout.tsx` - Dashboard 佈局
- ✅ `app/dashboard/hcm/ess/dashboard/page.tsx` - ESS 儀表板
- ✅ `app/dashboard/hcm/admin/dashboards/page.tsx` - BI 儀表板
- ✅ `app/globals.css` - 全域樣式

## 📋 待完成的頁面

以下頁面需要逐步遷移（共 59 個檔案）：

- `app/dashboard/hcm/**/*.tsx` - HCM 相關頁面
- `app/dashboard/wms/**/*.tsx` - WMS 相關頁面
- `app/dashboard/field-operations/**/*.tsx` - 現場作業相關頁面
- `app/dashboard/my-mobile-pos/**/*.tsx` - POS 相關頁面
- `app/dashboard/nextjs-toolbox/**/*.tsx` - 工具箱頁面
- 其他 dashboard 子頁面

## 🎯 遷移優先順序

1. **高優先級**: 主要功能頁面（HCM、WMS、CRM 等）
2. **中優先級**: 工具頁面（Next.js Toolbox）
3. **低優先級**: 示範/測試頁面

## 🔍 驗證清單

遷移完成後，請檢查：

- [ ] 亮色模式顯示正常
- [ ] 深色模式顯示正常
- [ ] 文字對比度符合可訪問性標準
- [ ] 按鈕和互動元素有適當的懸停狀態
- [ ] 響應式設計在各種螢幕尺寸下正常顯示
- [ ] 沒有遺漏的硬編碼顏色

## 📚 參考資源

- [設計系統完整文件](./design-system.md)
- [設計 Token 配置檔](../config/design-tokens/netsuite.json)
- [Tailwind CSS 文件](https://tailwindcss.com/docs)

---

**最後更新**: 2025-01-XX

