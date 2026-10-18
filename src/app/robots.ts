import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/listing-image/"],
        // Admin, API and account pages have nothing for searchers; image routes stay crawlable for Google Images.
        // Sign-in pages stay crawlable so Google can read their noindex tag.
        disallow: ["/admin", "/api/", "/dashboard", "/profile", "/*?*sort="],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
