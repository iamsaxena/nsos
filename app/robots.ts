import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/adminpanel", "/api/"] },
    ],
    sitemap: "https://www.nsos.live/sitemap.xml",
    host: "https://www.nsos.live",
  };
}
