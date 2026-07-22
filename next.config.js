/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/antenna-tracker-shared',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig