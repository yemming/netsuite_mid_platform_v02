/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Zeabur 部署優化：啟用 standalone 輸出以減少部署大小
  output: 'standalone',
  // 確保靜態資源和依賴項正確處理
  experimental: {
    outputFileTracingIncludes: {
      '/': ['./public/**/*'],
    },
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@esbuild/linux-x64',
      ],
    },
  },
  // 確保靜態資源路徑正確
  distDir: '.next',
}

module.exports = nextConfig

