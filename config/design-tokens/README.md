# 設計 Token 配置檔使用指南

## 📁 檔案結構

```
config/design-tokens/
  ├── netsuite.json          # NetSuite Next 主題配置
  ├── modern.json            # 現代風格主題（未來可擴展）
  ├── minimal.json           # 極簡風格主題（未來可擴展）
  └── README.md              # 本文件
```

## 🎨 如何使用

### 1. 查看當前主題

當前使用的主題配置在 `netsuite.json` 中定義。

### 2. 切換主題

要切換到不同的主題：

1. 建立新的 JSON 配置檔（例如 `modern.json`）
2. 修改 `lib/design-system/theme-loader.ts`（如果有的話）來載入新主題
3. 或直接修改 `app/globals.css` 中的 CSS 變數

### 3. 自訂主題

你可以：

1. **複製現有主題**: 複製 `netsuite.json` 並重新命名
2. **修改配置**: 調整色彩、字體、間距等值
3. **套用變更**: 使用主題生成工具（如果有的話）或手動更新 CSS

## 📝 JSON 配置檔結構

每個主題配置檔包含以下主要區塊：

- `colors`: 色彩系統定義
- `typography`: 字體系統定義
- `spacing`: 間距系統定義
- `borderRadius`: 圓角系統定義
- `shadows`: 陰影系統定義
- `components`: 元件特定樣式
- `breakpoints`: 響應式斷點
- `animations`: 動畫設定
- `zIndex`: 層級設定

## 🔧 未來擴展

未來可以建立：

1. **主題生成器**: 自動從 JSON 生成 CSS 變數
2. **主題預覽工具**: 視覺化預覽不同主題
3. **主題切換 API**: 運行時動態切換主題

## 📚 相關文件

- [設計系統完整文件](../docs/design-system.md)
- [Tailwind CSS 配置](../tailwind.config.js)
- [全域樣式](../app/globals.css)

