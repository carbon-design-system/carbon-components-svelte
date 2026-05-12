import fs from "node:fs";
import { BASE_URL, SITEMAP_PATH } from "./constants";
import { getComponentNames } from "./utils";

const urls: string[] = [];

urls.push(`
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`);

for (const componentName of getComponentNames()) {
  urls.push(`
  <url>
    <loc>${BASE_URL}/components/${componentName}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
}

urls.push(`
  <url>
    <loc>${BASE_URL}/llms.txt</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`);

urls.push(`
  <url>
    <loc>${BASE_URL}/llms-full.txt</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>
`;

fs.writeFileSync(SITEMAP_PATH, sitemap);

console.log(`Sitemap generated with ${urls.length} URLs`);
