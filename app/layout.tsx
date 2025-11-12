import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import ColorfulHeaderBar from '@/components/colorful-header-bar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NetSuite交易模擬系統',
  description: 'NetSuite AI Solution Platform with Next.js, Supabase, N8n Integration',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  // 移除 appleWebApp.capable 以避免棄用警告
  // 如果需要 PWA 功能，可以在 manifest.json 中設定
  appleWebApp: {
    statusBarStyle: 'default',
    title: 'NetSuite交易模擬系統',
  },
}

export const viewport: Viewport = {
  themeColor: '#28363F',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ColorfulHeaderBar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

