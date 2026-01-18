/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable ESLint during build since we use Biome
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
