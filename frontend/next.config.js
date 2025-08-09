/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    forceSwcTransforms: true,
  },
  trailingSlash: false,
};

module.exports = nextConfig;
