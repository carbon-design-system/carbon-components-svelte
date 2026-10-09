/**
 * Checks and previews the catalog thumbnails in thumbnails/. See
 * thumbnails/README.md for the design rules these enforce.
 *
 *   bun scripts/thumbnails.ts missing          # docs pages without a thumbnail
 *   bun scripts/thumbnails.ts audit [names…]   # mechanical rule violations
 *   bun scripts/thumbnails.ts sheet [names…]   # contact sheet → .context/thumbnails-sheet.png
 *   bun scripts/thumbnails.ts sheet --category Layout
 *   bun scripts/thumbnails.ts sheet meter .context/drafts/meter-b.svg
 *   bun scripts/thumbnails.ts themes [names…]  # all five themes → .context/thumbnails-themes.png
 *
 * `sheet` needs rsvg-convert (`brew install librsvg`). `themes` inlines
 * the SVGs into pages that load css/all.css (`bun run build:css`), the
 * only way their `var(--cds-*)` colors resolve, and screenshots them
 * with Playwright.
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";
import { PAGE_EXTENSION } from "../docs/scripts/constants";
import { COMPONENT_CATEGORIES } from "../docs/src/component-categories";
import {
  auditThumbnail,
  missingThumbnails,
  orphanThumbnails,
  thumbnailName,
} from "./lib/thumbnails";

const PAGES_DIR = "docs/src/pages/components";
const THUMBNAILS_DIR = "thumbnails";
const SHEET_DIR = ".context";
const XML_DECLARATION = /<\?xml[^>]*\?>/;

async function listNames(dir: string, extension: string): Promise<string[]> {
  return (await readdir(dir))
    .filter((file) => file.endsWith(extension))
    .map((file) => path.basename(file, extension))
    .sort();
}

const [command = "", ...args] = process.argv.slice(2);
const pages = await listNames(PAGES_DIR, PAGE_EXTENSION);
const thumbnails = await listNames(THUMBNAILS_DIR, ".svg");

if (command === "missing") {
  const missing = missingThumbnails(pages, thumbnails);
  for (const page of missing) {
    console.log(`${page} → ${THUMBNAILS_DIR}/${thumbnailName(page)}.svg`);
  }
  for (const orphan of orphanThumbnails(pages, thumbnails)) {
    console.log(`${THUMBNAILS_DIR}/${orphan}.svg has no docs page`);
  }
  if (missing.length === 0) console.log("Every docs page has a thumbnail.");
} else if (command === "audit") {
  const names = args.length > 0 ? args : thumbnails;
  const results = await Promise.all(
    names.map(async (name) => ({
      name,
      problems: auditThumbnail(
        name,
        await readFile(`${THUMBNAILS_DIR}/${name}.svg`, "utf8"),
      ),
    })),
  );
  const failing = results.filter(({ problems }) => problems.length > 0);
  for (const { name, problems } of failing) {
    console.log(`${name}.svg`);
    for (const problem of problems) console.log(`  ${problem}`);
  }
  const failures = failing.length;
  console.log(
    failures === 0
      ? "No problems found."
      : `${failures} file(s) with problems.`,
  );
  process.exitCode = failures === 0 ? 0 : 1;
} else if (command === "sheet") {
  // Rasterize each file first: inlining several SVGs into one document
  // would let their ids collide.
  let names = args.length > 0 ? args : thumbnails;
  if (args[0] === "--category") {
    const label = args.slice(1).join(" ").toLowerCase();
    const category = COMPONENT_CATEGORIES.find(
      (entry) => entry.label.toLowerCase() === label,
    );
    if (!category) {
      const labels = COMPONENT_CATEGORIES.map((entry) => entry.label);
      console.error(`Unknown category. Pick one of: ${labels.join(", ")}`);
      process.exit(1);
    }
    names = category.components
      .map(thumbnailName)
      .filter((name) => thumbnails.includes(name));
  }
  const tmp = path.join(SHEET_DIR, "thumbnails-sheet");
  await mkdir(tmp, { recursive: true });
  const columns = Math.min(names.length, 4);
  const rows = Math.ceil(names.length / columns);
  const width = columns * 330 + 10;
  const height = rows * 210 + 10;
  const tiles = await Promise.all(
    names.map(async (name, i) => {
      // A name ending in .svg is a path, for drafts kept outside thumbnails/.
      const file = name.endsWith(".svg")
        ? name
        : `${THUMBNAILS_DIR}/${name}.svg`;
      const label = path.basename(file, ".svg");
      const png = path.join(tmp, `${i}-${label}.png`);
      await $`rsvg-convert -w 320 -h 180 ${file} -o ${png}`;
      const data = (await readFile(png)).toString("base64");
      const x = (i % columns) * 330 + 10;
      const y = Math.floor(i / columns) * 210 + 10;
      return [
        `<rect x="${x}" y="${y}" width="320" height="180" fill="#fff"/>`,
        `<image x="${x}" y="${y}" width="320" height="180" href="data:image/png;base64,${data}"/>`,
        `<text x="${x}" y="${y + 196}" font-family="Helvetica, Arial, sans-serif" font-size="13">${label}</text>`,
      ].join("");
    }),
  );
  const sheet = path.join(tmp, "sheet.svg");
  await writeFile(
    sheet,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#ccc"/>${tiles.join("")}</svg>`,
  );
  const out = path.join(SHEET_DIR, "thumbnails-sheet.png");
  await $`rsvg-convert ${sheet} -o ${out}`;
  await rm(tmp, { recursive: true });
  console.log(out);
} else if (command === "themes") {
  const { chromium } = await import("playwright");
  const names = args.length > 0 ? args : thumbnails;
  const css = await readFile("css/all.css", "utf8").catch(() => {
    console.error("css/all.css is missing. Run `bun run build:css` first.");
    process.exit(1);
  });
  const svgs = await Promise.all(
    names.map(async (name) =>
      (await readFile(`${THUMBNAILS_DIR}/${name}.svg`, "utf8"))
        .replace(XML_DECLARATION, "")
        .replace('width="320px" height="180px"', 'width="160" height="90"'),
    ),
  );
  const columns = Math.min(names.length, 8);
  const width = columns * 168 + 16;
  const height = Math.ceil(names.length / columns) * 112 + 40;
  const tiles = svgs
    .map(
      (svg, i) =>
        `<figure><div class="tile">${svg}</div><figcaption>${names[i]}</figcaption></figure>`,
    )
    .join("");
  // Themes are scoped to :root[theme=…], so each theme gets its own iframe.
  const themes = ["white", "g10", "g80", "g90", "g100"];
  const frame = (theme: string) => {
    const attribute = theme === "white" ? "" : ` theme="${theme}"`;
    const doc = `<!doctype html><html${attribute}><head><style>${css}
      body { margin: 0; padding: 8px; background: var(--cds-ui-background); color: var(--cds-text-02); font: 11px sans-serif; }
      .grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
      figure { margin: 0; width: 160px; }
      .tile { height: 90px; outline: 1px solid var(--cds-ui-03); }
    </style></head><body><b>${theme}</b><div class="grid">${tiles}</div></body></html>`;
    const srcdoc = doc.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
    return `<iframe srcdoc="${srcdoc}" style="display:block;border:0;width:${width}px;height:${height}px"></iframe>`;
  };
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height: 600 } });
  await page.setContent(
    `<body style="margin:0">${themes.map(frame).join("")}</body>`,
  );
  await page.waitForLoadState("load");
  const out = path.join(SHEET_DIR, "thumbnails-themes.png");
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log(out);
} else {
  console.error(
    "Usage: bun scripts/thumbnails.ts <missing|audit|sheet|themes> [names…]",
  );
  process.exitCode = 1;
}
