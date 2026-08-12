import type { MetadataRoute } from "next";

const SITE_URL = "https://mytool-kit.netlify.app";

const TOOL_PATHS = [
  // Code
  "/tools/code",
  "/tools/code/json-formatter",
  "/tools/code/regex-tester",
  "/tools/code/sql-formatter",
  "/tools/code/diff-tool",
  "/tools/code/markdown-editor",
  "/tools/code/api-tester",
  "/tools/code/snippet-manager",
  "/tools/code/lint-analyzer",
  "/tools/code/json-schema-validator",
  "/tools/code/cron-builder",
  "/tools/code/http-status",
  // Design
  "/tools/design",
  "/tools/design/icon-library",
  "/tools/design/font-preview",
  "/tools/design/grid-generator",
  "/tools/design/color-picker",
  "/tools/design/color-palette",
  "/tools/design/gradient-generator",
  "/tools/design/glassmorphism",
  "/tools/design/svg-editor",
  "/tools/design/tailwind-theme",
  "/tools/design/css-animation",
  "/tools/design/box-shadow",
  "/tools/design/border-radius",
  "/tools/design/image-optimizer",
  // Encode/Decode
  "/tools/encode-decode",
  "/tools/encode-decode/base-encoder",
  "/tools/encode-decode/crypto-tool",
  "/tools/encode-decode/url-shortener",
  "/tools/encode-decode/jwt-decoder",
  "/tools/encode-decode/html-encoder",
  "/tools/encode-decode/sha256",
  // Text
  "/tools/text",
  "/tools/text/lang-detector",
  "/tools/text/summarizer",
  "/tools/text/alt-text",
  "/tools/text/word-counter",
  "/tools/text/case-converter",
  "/tools/text/slug-generator",
  "/tools/text/lorem-ipsum",
  "/tools/text/text-diff",
  // Converter
  "/tools/converter",
  "/tools/converter/audio-converter",
  "/tools/converter/video-converter",
  "/tools/converter/font-converter",
  "/tools/converter/doc-converter",
  "/tools/converter/image-converter",
  "/tools/converter/qr-tool",
  "/tools/converter/markdown-html",
  // Web
  "/tools/web",
  "/tools/web/color-contrast",
  "/tools/web/seo-analyzer",
  "/tools/web/performance-test",
  "/tools/web/cookie-viewer",
  "/tools/web/meta-preview",
  "/tools/web/og-preview",
  "/tools/web/robots-generator",
  "/tools/web/sitemap-generator",
  "/tools/web/cors-tester",
  // Data Format
  "/tools/data-format",
  "/tools/data-format/csv-json",
  "/tools/data-format/excel-converter",
  "/tools/data-format/uuid-generator",
  "/tools/data-format/data-generator",
  "/tools/data-format/timestamp-converter",
  "/tools/data-format/json-path",
  // Jobs
  "/tools/jobs",
  "/tools/jobs/area-calculator",
  "/tools/jobs/finance-calculator",
  "/tools/jobs/severance",
  "/tools/jobs/hourly-salary",
  "/tools/jobs/tax-calculator",
  // Etc
  "/tools/etc",
  "/tools/etc/crypto-tracker",
  "/tools/etc/currency-converter",
  "/tools/etc/ip-lookup",
  "/tools/etc/coffee-bet",
  "/tools/etc/pomodoro",
  "/tools/etc/ascii-art",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const toolRoutes: MetadataRoute.Sitemap = TOOL_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path.split("/").length === 3 ? 0.8 : 0.7,
  }));

  return [...staticRoutes, ...toolRoutes];
}
