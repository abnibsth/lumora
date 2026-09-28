import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/img/logo.png?v=lumora",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:8080/api/:path*" },
      { source: "/how-it-works", destination: "/kebijakan-privasi?view=how-it-works" },
      { source: "/for-business", destination: "/kebijakan-privasi?view=for-business" },
      { source: "/for-partners", destination: "/kebijakan-privasi?view=for-partners" },
      { source: "/about", destination: "/kebijakan-privasi?view=about" },
    ];
  },
};

export default nextConfig;
