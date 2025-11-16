/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Zeabur 部署優化：只在生產環境啟用 standalone 輸出
  // 開發環境不啟用，避免影響編譯速度
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
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
  }),
  // 確保靜態資源路徑正確
  distDir: '.next',
}

module.exports = nextConfig

