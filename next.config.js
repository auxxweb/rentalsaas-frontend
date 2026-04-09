/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://server.rentalsaas.auxxbay.com/api',
    // NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  },
  experimental: {
    optimizePackageImports: ['date-fns'],
  },
}

module.exports = nextConfig
