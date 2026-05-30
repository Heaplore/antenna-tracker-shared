/** @type {import('next').NextConfig} */
const nextConfig = {
  // 暂时移除 static export，保留开发模式
  // output: 'export',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig