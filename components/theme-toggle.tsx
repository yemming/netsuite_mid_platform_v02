'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // 避免 hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-gray-100 dark:bg-secondary">
        <div className="w-5 h-5" />
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-secondary transition-colors"
      aria-label="切換主題"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-[#28363F] dark:text-white" />
      ) : (
        <Moon className="w-4 h-4 text-[#28363F] dark:text-white" />
      )}
    </button>
  )
}

