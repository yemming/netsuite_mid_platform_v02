'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ColorfulHeaderBar() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 判斷是否為深色模式
  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark')

  // 淺色模式：使用淡色系混合（淡黃色、淡紫色、淡藍色及其混合色）
  const pastelGradient = 'linear-gradient(90deg, #fef3c7 0%, #e9d5ff 8%, #fef3c7 15%, #ddd6fe 22%, #fef3c7 28%, #bfdbfe 35%, #fef3c7 42%, #fce7f3 48%, #e9d5ff 55%, #fef3c7 62%, #c7d2fe 68%, #fef3c7 75%, #e9d5ff 82%, #bfdbfe 88%, #fef3c7 95%, #ddd6fe 100%)'
  
  // 深色模式：第一版的深色墨綠色調
  const darkGradient = 'linear-gradient(90deg, #1a2e2a 0%, #2d4a3f 8%, #3a5a4f 12%, #4a6b5f 18%, #2d3a4a 25%, #3a4a5a 32%, #2d4a3f 38%, #1a2e2a 45%, #2d3a4a 52%, #3a5a4f 58%, #4a6b5f 65%, #2d4a3f 72%, #3a4a5a 78%, #1a2e2a 85%, #2d3a4a 92%, #3a5a4f 100%)'

  return (
    <div 
      className="w-full h-1.5 fixed top-0 left-0 right-0 z-[100] overflow-hidden colorful-header-bar"
      style={{
        background: isDark ? darkGradient : pastelGradient,
      }}
    />
  )
}

