/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@soundspace/core', '@soundspace/ui'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
module.exports = nextConfig;
