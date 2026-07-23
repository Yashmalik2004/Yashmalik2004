/**
 * next.config.mjs
 *
 * Why it exists: Configures Next.js for SVG-only API responses.
 * - Sets security headers for SVG content.
 * - Disables image optimization (not needed; we serve raw SVG).
 * - Configures the app to work as a stateless Vercel function.
 */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/u/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/api/cards/:path*",
        headers: [
          { key: "Content-Type", value: "image/svg+xml; charset=utf-8" },
          { key: "Cache-Control", value: "public, s-maxage=900, stale-while-revalidate=1800" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
