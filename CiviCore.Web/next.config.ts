import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5075/api/:path*'
      },
      {
        source: '/public-media/:path*',
        destination: 'http://localhost:5075/public-media/:path*'
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5075/uploads/:path*'
      }
    ]
  }
};

export default nextConfig;
