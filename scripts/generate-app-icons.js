#!/usr/bin/env node

/**
 * 生成應用圖標腳本
 * 將 OC_Logo_Red.png 加上白色圓角背景，生成各種尺寸的 favicon 和 app icons
 * 風格類似 Google Chrome icon（白色圓角背景）
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const INPUT_LOGO = path.join(__dirname, '../public/OC_Logo_Red.png')
const OUTPUT_DIR = path.join(__dirname, '../public')

// 圓角半徑（相對於圖標尺寸的比例，類似 Chrome 的圓角）
const CORNER_RADIUS_RATIO = 0.22 // 約 22% 的圓角，類似 Chrome

// 需要生成的圖標尺寸配置
const ICON_SIZES = [
  // Favicon 尺寸
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  
  // 標準圖標
  { size: 64, name: 'icon-64x64.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 256, name: 'icon-256x256.png' },
  { size: 512, name: 'icon-512x512.png' },
  
  // Apple Touch Icon
  { size: 180, name: 'apple-icon.png' },
  
  // PWA Icons
  { size: 192, name: 'pwa-icon-192x192.png' },
  { size: 512, name: 'pwa-icon-512x512.png' },
  
  // 通用 icon.png (使用 512x512)
  { size: 512, name: 'icon.png' },
]

/**
 * 創建白色圓角背景
 */
async function createWhiteRoundedBackground(size, cornerRadius) {
  // 創建 SVG 圓角矩形背景
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/>
    </svg>
  `
  
  return sharp(Buffer.from(svg))
    .png()
    .toBuffer()
}

/**
 * 生成單個圖標
 */
async function generateIcon(size, outputName) {
  try {
    console.log(`生成 ${size}x${size} -> ${outputName}...`)
    
    const cornerRadius = Math.round(size * CORNER_RADIUS_RATIO)
    const padding = Math.round(size * 0.15) // Logo 周圍的 padding（15%）
    const logoSize = size - (padding * 2)
    
    // 1. 創建白色圓角背景
    const background = await createWhiteRoundedBackground(size, cornerRadius)
    
    // 2. 讀取並調整 logo 大小
    const logo = await sharp(INPUT_LOGO)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // 透明背景
      })
      .toBuffer()
    
    // 3. 將 logo 合成到背景上（居中）
    const finalIcon = await sharp(background)
      .composite([{
        input: logo,
        top: padding,
        left: padding,
      }])
      .png()
      .toBuffer()
    
    // 4. 保存文件
    const outputPath = path.join(OUTPUT_DIR, outputName)
    await fs.promises.writeFile(outputPath, finalIcon)
    
    console.log(`✅ ${outputName} 生成成功`)
    
    return outputPath
  } catch (error) {
    console.error(`❌ 生成 ${outputName} 失敗:`, error.message)
    throw error
  }
}

/**
 * 生成 favicon.ico（多尺寸 ICO 文件）
 */
async function generateFaviconIco() {
  try {
    console.log('生成 favicon.ico...')
    
    // ICO 文件需要多個尺寸
    const icoSizes = [16, 32, 48]
    const buffers = []
    
    for (const size of icoSizes) {
      const cornerRadius = Math.round(size * CORNER_RADIUS_RATIO)
      const padding = Math.round(size * 0.15)
      const logoSize = size - (padding * 2)
      
      const background = await createWhiteRoundedBackground(size, cornerRadius)
      const logo = await sharp(INPUT_LOGO)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer()
      
      const icon = await sharp(background)
        .composite([{
          input: logo,
          top: padding,
          left: padding,
        }])
        .png()
        .toBuffer()
      
      buffers.push({ size, buffer: icon })
    }
    
    // 使用 sharp 創建 ICO（實際上 sharp 不直接支持 ICO，我們用 PNG 代替）
    // 或者我們可以創建一個簡單的 favicon.ico 使用 32x32
    const favicon32 = buffers.find(b => b.size === 32)
    if (favicon32) {
      const outputPath = path.join(OUTPUT_DIR, 'favicon.ico')
      // 注意：sharp 不能直接生成 ICO，我們複製 32x32 PNG 作為 favicon.ico
      // 實際上瀏覽器也支持 PNG 格式的 favicon
      await fs.promises.writeFile(outputPath, favicon32.buffer)
      console.log('✅ favicon.ico 生成成功（使用 32x32 PNG）')
    }
  } catch (error) {
    console.error('❌ 生成 favicon.ico 失敗:', error.message)
  }
}

/**
 * 主函數
 */
async function main() {
  console.log('🚀 開始生成應用圖標...')
  console.log(`輸入文件: ${INPUT_LOGO}`)
  console.log(`輸出目錄: ${OUTPUT_DIR}`)
  console.log('')
  
  // 檢查輸入文件是否存在
  if (!fs.existsSync(INPUT_LOGO)) {
    console.error(`❌ 錯誤: 找不到輸入文件 ${INPUT_LOGO}`)
    process.exit(1)
  }
  
  try {
    // 生成所有尺寸的圖標
    for (const config of ICON_SIZES) {
      await generateIcon(config.size, config.name)
    }
    
    // 生成 favicon.ico
    await generateFaviconIco()
    
    console.log('')
    console.log('✨ 所有圖標生成完成！')
    console.log('')
    console.log('生成的圖標文件：')
    ICON_SIZES.forEach(config => {
      console.log(`  - ${config.name} (${config.size}x${config.size})`)
    })
    console.log('  - favicon.ico')
    
  } catch (error) {
    console.error('❌ 生成過程出錯:', error)
    process.exit(1)
  }
}

// 執行主函數
main()

