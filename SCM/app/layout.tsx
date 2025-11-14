import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'o9 需求規劃平台',
  description: '探索性數據分析、預測分析與需求假設管理平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" className="dark">
      <body className={`${inter.className} bg-[#1F1F1F] text-[#E0E0E0] antialiased`}>
        {children}
      </body>
    </html>
  )
}

