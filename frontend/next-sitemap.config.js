/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: process.env.SITE_URL || "https://advanciapayledger.com",
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/dashboard"],
      },
    ],
    additionalSitemaps: [
      `${process.env.SITE_URL || "https://advanciapayledger.com"}/sitemap.xml`,
    ],
  },
  exclude: [
    "/admin/*",
    "/api/*",
    "/dashboard/*",
    "/auth/login",
    "/auth/register",
    "/404",
    "/500",
  ],
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
  additionalPaths: async () => {
    return [
      {
        loc: "/",
        changefreq: "daily",
        priority: 1.0,
        lastmod: new Date().toISOString(),
      },
      {
        loc: "/about",
        changefreq: "monthly",
        priority: 0.8,
        lastmod: new Date().toISOString(),
      },
      {
        loc: "/features",
        changefreq: "monthly",
        priority: 0.8,
        lastmod: new Date().toISOString(),
      },
      {
        loc: "/pricing",
        changefreq: "monthly",
        priority: 0.8,
        lastmod: new Date().toISOString(),
      },
      {
        loc: "/docs",
        changefreq: "weekly",
        priority: 0.8,
        lastmod: new Date().toISOString(),
      },
      {
        loc: "/support",
        changefreq: "monthly",
        priority: 0.7,
        lastmod: new Date().toISOString(),
      },
    ];
  },
};

module.exports = config;
