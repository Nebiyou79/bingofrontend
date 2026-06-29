/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  async rewrites() {
    // Must be the backend root — no /api suffix
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    return {
      beforeFiles: [
        // authApi.ts calls:    fetch('/api/auth/login')   → :path* = 'auth/login'
        // destination:         http://localhost:5000/api/auth/login  ✓
        {
          source:      '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
        // Socket.IO polling fallback
        {
          source:      '/socket.io/:path*',
          destination: `${backendUrl}/socket.io/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
