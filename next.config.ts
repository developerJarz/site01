import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  images: {
    // AVIF first (~30–50% smaller than WebP for photos), WebP as the fallback.
    formats: ["image/avif", "image/webp"],
    // Tuned to the layouts: card grids top out around 22rem, the gallery at ~50rem.
    deviceSizes: [384, 640, 828, 1080, 1280, 1600],
    imageSizes: [48, 64, 96, 128, 192, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/brands/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      {
        source: "/car-hat-bd.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
