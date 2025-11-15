/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    dirs: ['pages', 'components', 'lib', 'app'],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'Toy-for-Toy',
    NEXT_PUBLIC_APP_VERSION: '0.1.0',
  },
  headers: async () => {
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
        ],
      },
    ];
  },
  rewrites: async () => {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
  redirects: async () => {
    return [];
  },
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
};

module.exports = nextConfig;
