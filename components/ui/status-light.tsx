'use client'

import React from 'react'

interface StatusLightProps {
  status: 'success' | 'warning' | 'error' | 'pending' | 'none'
  size?: number
  className?: string
  title?: string
}

export function StatusLight({ status, size = 16, className = '', title }: StatusLightProps) {
  const lightConfig = {
    success: {
      color: '#22c55e', // green-500
      glowColor: '#16a34a', // green-600
      lightColor: '#4ade80', // green-400
      gradient: ['#86efac', '#4ade80', '#22c55e', '#16a34a'], // green-300, green-400, green-500, green-600
    },
    warning: {
      color: '#eab308', // yellow-500
      glowColor: '#ca8a04', // yellow-600
      lightColor: '#fde047', // yellow-400
      gradient: ['#fef08a', '#fde047', '#eab308', '#ca8a04'], // yellow-300, yellow-400, yellow-500, yellow-600
    },
    error: {
      color: '#ef4444', // red-500
      glowColor: '#dc2626', // red-600
      lightColor: '#f87171', // red-400
      gradient: ['#fca5a5', '#f87171', '#ef4444', '#dc2626'], // red-300, red-400, red-500, red-600
    },
    pending: {
      color: '#9ca3af', // gray-400
      glowColor: '#6b7280', // gray-500
      lightColor: '#d1d5db', // gray-300
      gradient: ['#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280'], // gray-200, gray-300, gray-400, gray-500
    },
    none: {
      color: '#9ca3af', // gray-400
      glowColor: '#6b7280', // gray-500
      lightColor: '#d1d5db', // gray-300
      gradient: ['#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280'], // gray-200, gray-300, gray-400, gray-500
    },
  }

  const config = lightConfig[status]
  const center = size / 2
  const radius = size * 0.35
  const isActive = status !== 'none' && status !== 'pending'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ 
        filter: isActive 
          ? `drop-shadow(0 0 ${size * 0.3}px ${config.glowColor}cc) drop-shadow(0 0 ${size * 0.15}px ${config.lightColor}ff)` 
          : undefined 
      }}
    >
      <defs>
        {/* 主體漸變（從亮到暗） */}
        <radialGradient id={`glow-${status}`} cx="45%" cy="45%">
          <stop offset="0%" stopColor={config.gradient[0]} stopOpacity="1" />
          <stop offset="30%" stopColor={config.gradient[1]} stopOpacity="1" />
          <stop offset="70%" stopColor={config.gradient[2]} stopOpacity="0.95" />
          <stop offset="100%" stopColor={config.gradient[3]} stopOpacity="0.8" />
        </radialGradient>
        
        {/* 高光效果（左上角） */}
        <radialGradient id={`highlight-${status}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        
        {/* 外圈光暈 */}
        {isActive && (
          <radialGradient id={`outer-glow-${status}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor={config.lightColor} stopOpacity="0.4" />
            <stop offset="50%" stopColor={config.color} stopOpacity="0.2" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        )}
      </defs>
      
      {/* 外圈光暈層（僅在 active 狀態顯示） */}
      {isActive && (
        <circle
          cx={center}
          cy={center}
          r={radius * 1.4}
          fill={`url(#outer-glow-${status})`}
        />
      )}
      
      {/* 主燈體 */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill={`url(#glow-${status})`}
        stroke={isActive ? config.lightColor : config.color}
        strokeWidth={size * 0.04}
        strokeOpacity={isActive ? "0.5" : "0.3"}
      />
      
      {/* 高光（左上角） */}
      <circle
        cx={center * 0.65}
        cy={center * 0.65}
        r={radius * 0.5}
        fill={`url(#highlight-${status})`}
      />
      
      {/* 內圈高光點 */}
      {isActive && (
        <circle
          cx={center * 0.7}
          cy={center * 0.7}
          r={radius * 0.2}
          fill="#ffffff"
          fillOpacity="0.6"
        />
      )}
      
      {title && <title>{title}</title>}
    </svg>
  )
}

