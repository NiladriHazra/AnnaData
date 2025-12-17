/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['images.unsplash.com'],
    },
    turbopack: {},
    env: {
      NEXT_PUBLIC_GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    },
  };
  
  module.exports = nextConfig;
