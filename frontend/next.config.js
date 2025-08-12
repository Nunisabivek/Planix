/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for Vercel deployment
  trailingSlash: false,
  generateEtags: false,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    unoptimized: true,
    domains: []
  },
  
  // Only add no-cache headers in development
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate',
            },
          ],
        },
      ];
    }
    return [];
  },
  
  // Webpack configuration for better compatibility
  webpack: (config, { isServer }) => {
    // Fix for packages that depend on fs module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false
      };
    }
    return config;
  },
};

module.exports = nextConfig;
