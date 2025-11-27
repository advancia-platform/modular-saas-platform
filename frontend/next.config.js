/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Performance optimizations
  swcMinify: true,
  poweredByHeader: false,

  // Bundle optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lodash', 'date-fns', 'recharts'],
  },

  // Compression and caching
  compress: true,

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
      // Cache static assets
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Production client-side optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 244000, // 244KB
          },
          common: {
            minChunks: 2,
            chunks: 'all',
            enforce: true,
            maxSize: 244000,
          },
        },
      };

      // Bundle analyzer (uncomment when needed)
      // if (process.env.ANALYZE === 'true') {
      //   const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      //   config.plugins.push(
      //     new BundleAnalyzerPlugin({
      //       analyzerMode: 'static',
      //       reportFilename: './analyze/client.html'
      //     })
      //   );
      // }
    }

    return config;
  },

  // Environment variables
  env: {
    CUSTOM_BUILD_TIME: new Date().toISOString(),
  },

  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/overview',
        permanent: false,
      },
    ];
  },

  // TypeScript optimization
  typescript: {
    tsconfigPath: './tsconfig.json',
  },

  // ESLint optimization
  eslint: {
    dirs: ['src', 'pages', 'components', 'lib'],
  },
};

export default nextConfig;
