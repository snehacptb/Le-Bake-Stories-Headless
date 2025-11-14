/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: 'headless-wp.local',
      },
      {
        protocol: 'http',
        hostname: 'manila.esdemo.in',
      },
      {
        protocol: 'https',
        hostname: 'manila.esdemo.in',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.wp.com',
      },
      {
        protocol: 'https',
        hostname: '*.wordpress.com',
      },
    ],
    unoptimized: true, // Completely disable optimization
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  env: {
    // Ensure public variables are exposed for client-side usage
    NEXT_PUBLIC_WORDPRESS_URL: process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_API_URL,
    NEXT_PUBLIC_WC_CONSUMER_KEY: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY || process.env.WORDPRESS_CONSUMER_KEY,
    NEXT_PUBLIC_WC_CONSUMER_SECRET: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET || process.env.WORDPRESS_CONSUMER_SECRET,
    // Keep server-only aliases for backward compatibility
    WORDPRESS_API_URL: process.env.WORDPRESS_API_URL,
    WORDPRESS_CONSUMER_KEY: process.env.WORDPRESS_CONSUMER_KEY,
    WORDPRESS_CONSUMER_SECRET: process.env.WORDPRESS_CONSUMER_SECRET,
  },
  async rewrites() {
    const wordpressUrl = process.env.WORDPRESS_API_URL;
    const destination = wordpressUrl?.startsWith('http') 
      ? `${wordpressUrl}/:path*`
      : `http://${wordpressUrl}/:path*`;
    
    return [
      {
        source: '/api/wp/:path*',
        destination: destination,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
