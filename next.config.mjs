/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour les images externes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.midjourney.com',
      },
      {
        protocol: 'https',
        hostname: '**.imagineapi.dev',
      },
      {
        protocol: 'https',
        hostname: '**.runwayml.com',
      },
      {
        protocol: 'https',
        hostname: '**.lumalabs.ai',
      },
    ],
  },
  
  // Activer le mode expérimental pour les Server Actions
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

export default nextConfig
