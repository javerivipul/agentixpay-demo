/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },
  webpack: (config, { dev }) => {
    // Next dev can get into a bad cached state in this workspace (missing chunk modules like './352.js').
    // Disabling webpack cache in dev keeps HMR reliable.
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
