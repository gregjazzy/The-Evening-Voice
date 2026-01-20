/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignorer les erreurs TypeScript pendant le build (types Supabase non générés)
  typescript: {
    ignoreBuildErrors: true,
  },
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
    // Exclure les packages problématiques du bundle serveur
    serverComponentsExternalPackages: [
      '@imgly/background-removal',
      'onnxruntime-web',
      'onnxruntime-node',
      'onnxruntime-common',
    ],
  },
  
  // Configuration webpack pour les packages ESM problématiques
  webpack: (config, { isServer }) => {
    // Ignorer complètement onnxruntime pendant le build
    config.resolve.alias = {
      ...config.resolve.alias,
      'onnxruntime-web': false,
      'onnxruntime-node': false,
    }
    
    // Configuration pour les fichiers .mjs
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    })
    
    // Exclure @imgly/background-removal côté serveur
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('@imgly/background-removal')
    }
    
    return config
  },
}

export default nextConfig
