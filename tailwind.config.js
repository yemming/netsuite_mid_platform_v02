/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        // 調整字體大小：基礎 14px，小字 12px
        xs: ['0.75rem', { lineHeight: '1.125rem' }],       // 12px (小字/描述文字)
        sm: ['0.875rem', { lineHeight: '1.25rem' }],      // 14px (中文字/用戶名等)
        base: ['0.875rem', { lineHeight: '1.4rem' }],      // 14px (基礎字體)
        lg: ['1rem', { lineHeight: '1.5rem' }],            // 16px
        xl: ['1.125rem', { lineHeight: '1.75rem' }],       // 18px
        '2xl': ['1.25rem', { lineHeight: '1.875rem' }],   // 20px
        '3xl': ['1.5rem', { lineHeight: '2rem' }],         // 24px
        '4xl': ['1.875rem', { lineHeight: '2.25rem' }],    // 30px
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

