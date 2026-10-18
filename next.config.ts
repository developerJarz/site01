import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Watermark fonts and preview photos are read from disk at runtime, so the tracer can't see them on its own.
  outputFileTracingIncludes: {
    "/api/upload": ["./src/assets/fonts/**/*"],
    "/api/admin/watermark/preview": ["./src/assets/fonts/**/*", "./public/images/home/{hero-bmw,sell-banner,cat-suv}.jpg"],
  },
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
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    // The saved Turbopack dev cache (.next/dev/cache/turbopack) got corrupted on this machine and left
    // /api/upload "Compiling…" forever, even across restarts. Compiling fresh each `next dev` is a few
    // seconds slower to start but can't get stuck that way. Set to true to bring the cache back.
    turbopackFileSystemCacheForDev: false,
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
