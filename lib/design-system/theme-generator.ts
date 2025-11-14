/**
 * 主題生成器
 * 從設計 Token JSON 配置檔生成 CSS 變數
 */

import fs from 'fs';
import path from 'path';

interface DesignTokens {
  colors: {
    primary: { DEFAULT: string; foreground: string; [key: string]: string };
    secondary: { DEFAULT: string; foreground: string };
    accent: { DEFAULT: string; foreground: string };
    destructive: { DEFAULT: string; foreground: string };
    muted: { DEFAULT: string; foreground: string };
    semantic: {
      success: { DEFAULT: string; foreground: string };
      warning: { DEFAULT: string; foreground: string };
      error: { DEFAULT: string; foreground: string };
      info: { DEFAULT: string; foreground: string };
    };
    neutral: {
      light: {
        background: string;
        foreground: string;
        muted: string;
        mutedForeground: string;
        border: string;
        input: string;
        card: string;
        cardForeground: string;
        popover: string;
        popoverForeground: string;
      };
      dark: {
        background: string;
        foreground: string;
        muted: string;
        mutedForeground: string;
        border: string;
        input: string;
        card: string;
        cardForeground: string;
        popover: string;
        popoverForeground: string;
      };
    };
  };
  borderRadius: {
    DEFAULT: string;
    [key: string]: string;
  };
}

/**
 * 將 HSL 字串轉換為 CSS 變數格式（去掉 hsl() 包裝，只保留數值）
 */
function hslToCssVar(hsl: string): string {
  // 從 "hsl(203, 60%, 45%)" 提取 "203 60% 45%"
  const match = hsl.match(/hsl\(([^)]+)\)/);
  if (match) {
    return match[1];
  }
  return hsl;
}

/**
 * 從設計 Token 生成 CSS 變數
 */
export function generateThemeCSS(tokens: DesignTokens): string {
  const { colors, borderRadius } = tokens;
  
  let css = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* NetSuite Next UI - Light Mode */
    --background: ${hslToCssVar(colors.neutral.light.background)};
    --foreground: ${hslToCssVar(colors.neutral.light.foreground)};
    --card: ${hslToCssVar(colors.neutral.light.card)};
    --card-foreground: ${hslToCssVar(colors.neutral.light.cardForeground)};
    --popover: ${hslToCssVar(colors.neutral.light.popover)};
    --popover-foreground: ${hslToCssVar(colors.neutral.light.popoverForeground)};
    --primary: ${hslToCssVar(colors.primary.DEFAULT)};
    --primary-foreground: ${hslToCssVar(colors.primary.foreground)};
    --secondary: ${hslToCssVar(colors.secondary.DEFAULT)};
    --secondary-foreground: ${hslToCssVar(colors.secondary.foreground)};
    --muted: ${hslToCssVar(colors.neutral.light.muted)};
    --muted-foreground: ${hslToCssVar(colors.neutral.light.mutedForeground)};
    --accent: ${hslToCssVar(colors.accent.DEFAULT)};
    --accent-foreground: ${hslToCssVar(colors.accent.foreground)};
    --destructive: ${hslToCssVar(colors.destructive.DEFAULT)};
    --destructive-foreground: ${hslToCssVar(colors.destructive.foreground)};
    --border: ${hslToCssVar(colors.neutral.light.border)};
    --input: ${hslToCssVar(colors.neutral.light.input)};
    --ring: ${hslToCssVar(colors.primary.DEFAULT)};
    --radius: ${borderRadius.DEFAULT};
    
    /* NetSuite Custom Colors */
    --netsuite-dark-blue-green: ${hslToCssVar(colors.neutral.dark.background)};
    --netsuite-light-bg: ${hslToCssVar(colors.neutral.light.background)};
    --netsuite-text-dark: ${hslToCssVar(colors.neutral.light.foreground)};
    --netsuite-text-light: ${hslToCssVar(colors.neutral.dark.foreground)};
  }

  .dark {
    /* NetSuite Next UI - Dark Mode */
    --background: ${hslToCssVar(colors.neutral.dark.background)};
    --foreground: ${hslToCssVar(colors.neutral.dark.foreground)};
    --card: ${hslToCssVar(colors.neutral.dark.card)};
    --card-foreground: ${hslToCssVar(colors.neutral.dark.cardForeground)};
    --popover: ${hslToCssVar(colors.neutral.dark.popover)};
    --popover-foreground: ${hslToCssVar(colors.neutral.dark.popoverForeground)};
    --primary: ${hslToCssVar(colors.primary.DEFAULT)};
    --primary-foreground: ${hslToCssVar(colors.primary.foreground)};
    --secondary: ${hslToCssVar(colors.secondary.DEFAULT)};
    --secondary-foreground: ${hslToCssVar(colors.secondary.foreground)};
    --muted: ${hslToCssVar(colors.neutral.dark.muted)};
    --muted-foreground: ${hslToCssVar(colors.neutral.dark.mutedForeground)};
    --accent: ${hslToCssVar(colors.accent.DEFAULT)};
    --accent-foreground: ${hslToCssVar(colors.accent.foreground)};
    --destructive: ${hslToCssVar(colors.destructive.DEFAULT)};
    --destructive-foreground: ${hslToCssVar(colors.destructive.foreground)};
    --border: ${hslToCssVar(colors.neutral.dark.border)};
    --input: ${hslToCssVar(colors.neutral.dark.input)};
    --ring: ${hslToCssVar(colors.primary.DEFAULT)};
  }
}

/* Custom NetSuite Colors */
@layer utilities {
  .bg-netsuite-dark {
    background-color: hsl(${hslToCssVar(colors.neutral.dark.background)});
  }
  .bg-netsuite-light {
    background-color: hsl(${hslToCssVar(colors.neutral.light.background)});
  }
  .text-netsuite-dark {
    color: hsl(${hslToCssVar(colors.neutral.light.foreground)});
  }
  .text-netsuite-light {
    color: hsl(${hslToCssVar(colors.neutral.dark.foreground)});
  }
}

@layer base {
  * {
    @apply border-border;
  }
  html {
    font-size: 14px; /* 基礎字體大小 14px */
  }
  body {
    @apply bg-background text-foreground;
    font-size: 14px; /* 確保基礎字體大小一致 */
    line-height: 1.6; /* 適當的行高提升閱讀體驗 */
  }
}

/* Notion-style scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.4);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(71, 85, 105, 0.6);
}

/* Colorful Header Bar Animation */
@keyframes headerShimmer {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.colorful-header-bar {
  background-size: 200% 100%;
  animation: headerShimmer 20s ease-in-out infinite;
}

/* Override Chrome autofill styles to ensure readable text */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #ffffff inset !important;
  -webkit-text-fill-color: #111827 !important;
  box-shadow: 0 0 0 30px #ffffff inset !important;
  color: #111827 !important;
}

/* Override Chrome autofill for password field with light blue background */
input[type="password"]:-webkit-autofill,
input[type="password"]:-webkit-autofill:hover,
input[type="password"]:-webkit-autofill:focus,
input[type="password"]:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #E0F2F7 inset !important;
  -webkit-text-fill-color: #111827 !important;
  box-shadow: 0 0 0 30px #E0F2F7 inset !important;
  color: #111827 !important;
}

/* Signature Canvas Responsive Styles */
.signature-canvas {
  width: 100% !important;
  height: auto !important;
  max-width: 100%;
  touch-action: none;
}

.signature-canvas canvas {
  width: 100% !important;
  height: auto !important;
  max-width: 100%;
  display: block;
}

/* Fullscreen Signature Canvas Styles */
.signature-canvas-fullscreen {
  width: 100% !important;
  height: 100% !important;
  touch-action: none;
  position: absolute;
  top: 0;
  left: 0;
}

.signature-canvas-fullscreen canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
  touch-action: none;
}
`;

  return css;
}

/**
 * 從 JSON 檔案載入設計 Token 並生成 CSS
 */
export function generateThemeFromFile(themeFile: string = 'netsuite.json'): string {
  const themePath = path.join(process.cwd(), 'config', 'design-tokens', themeFile);
  const themeContent = fs.readFileSync(themePath, 'utf-8');
  const tokens: DesignTokens = JSON.parse(themeContent);
  return generateThemeCSS(tokens);
}

