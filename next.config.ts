import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/logs',
        permanent: true,
      },
    ];
  },
  reactCompiler: true,
};

export default nextConfig;
