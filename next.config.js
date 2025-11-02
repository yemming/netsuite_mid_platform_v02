/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Zeabur 部署優化：啟用 standalone 輸出以減少部署大小
  output: 'standalone',
}

module.exports = nextConfig

