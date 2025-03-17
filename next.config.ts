import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    serverComponentsExternalPackages: ['tesseract.js'],
    // @ts-ignore
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/tesseract.js/**/*']
    }
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh'
      }
    ]
  },
  webpack: (config: Configuration): Configuration => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      canvas: false,
      encoding: false
    };
    return config;
  }
};

export default nextConfig;
