import type { NextConfig } from "next";
import path from 'path';


const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias['yjs'] = path.resolve(__dirname, 'node_modules/yjs')
    }
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol : 'https',
        hostname : 'utfs.io',
        pathname : '/**'
      },
      {
        protocol : 'https',
        hostname : 'cn0d0b79y9.ufs.sh',
        pathname : '/**'
      },
       {
        protocol : 'https',
        hostname : '*.ufs.sh',
        pathname : '/**'
      }
    ],
  },
};

export default nextConfig;
