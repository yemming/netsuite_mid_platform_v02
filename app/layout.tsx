import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import ColorfulHeaderBar from '@/components/colorful-header-bar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NetSuite AI Nexus',
  description: 'NetSuite AI Solution Platform with Next.js, Supabase, N8n Integration',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NetSuite AI Nexus',
  },
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

