// @ts-check
import fs from "node:fs";

const BASE_URL = "https://svelte.carbondesignsystem.com";
const COMPONENTS_PATH = "./src/pages/components";
const SITEMAP_PATH = "./public/sitemap.xml";

const files = fs.readdirSync(COMPONENTS_PATH);

/** @type {string[]} */
const urls = [];

// Root page
urls.push(`
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`);

// Component pages
for (const file of files) {
  const [componentName] = file.split(".");
  urls.push(`
  <url>
    <loc>${BASE_URL}/components/${componentName}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
}

// llms.txt
urls.push(`
  <url>
    <loc>${BASE_URL}/llms.txt</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>
`;

fs.writeFileSync(SITEMAP_PATH, sitemap);

console.log(`Sitemap generated with ${urls.length} URLs`);
