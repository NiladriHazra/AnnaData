/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['images.unsplash.com'],
    },
    webpack(config) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
      return config;
    },
    env: {
      NEXT_PUBLIC_GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    },
  };
  
  module.exports = nextConfig;