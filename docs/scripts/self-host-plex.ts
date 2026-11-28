/**
 * Serves IBM Plex from the site, not from IBM's CDN.
 *
 * The library's theme sheets load Plex from `1.www.s81c.com`, which lets
 * browsers cache it for about 3 days. This rewrites each Plex URL in the
 * sheets to the same file in `@ibm/plex-sans` and `@ibm/plex-mono`.
 * Version 1.1.0 of both packages has the same bytes as the CDN.
 *
 * The `@font-face` rules keep the family names "IBM Plex Sans" and "IBM
 * Plex Mono", so IBM's footer and TrustArc's cookie banner, which set
 * those names, use the same files.
 *
 * The sheets point at `PLEX_URL` (`carbon-sheets.ts`). The build copies
 * the fonts there (`copyPlexFonts`), and the dev server serves them from
 * the packages; the path is versioned since the copies aren't
 * content-hashed.
 */
import fs from "node:fs";
import path from "node:path";
import type { BunPlugin } from "bun";

export const PLEX_URL = "/assets/plex-1.1.0";

const CDN_RE =
  /https:\/\/1\.www\.s81c\.com\/common\/carbon\/plex\/fonts\/IBM-Plex-(Sans|Mono)\/fonts\//g;
/** The page's `<link rel="preload">`s for the fonts most text uses. */
const PRELOAD_RE = /href="\.\/node_modules\/@ibm\/plex-(sans|mono)\//g;
const PLEX_REF = /\/assets\/plex-1\.1\.0\/(sans|mono)\/(fonts\/[^)"'\s]+)/g;

export function rewritePlexUrls(
  css: string,
  to: (family: "sans" | "mono") => string,
): string {
  return css.replace(CDN_RE, (_, family: string) =>
    to(family.toLowerCase() as "sans" | "mono"),
  );
}

/**
 * Leaves the page's Plex preloads for `copyPlexFonts`: Bun would resolve
 * each to a hashed copy of its own, which the sheets don't name. The dev
 * server has none.
 */
export const selfHostPlex: BunPlugin = {
  name: "self-host-plex",
  setup(build) {
    build.onLoad({ filter: /[\\/]docs[\\/]index\.html$/ }, (args) => ({
      contents: fs
        .readFileSync(args.path, "utf8")
        .replace(PRELOAD_RE, `data-plex-href="${PLEX_URL}/$1/`),
      loader: "html",
    }));
  },
};

/** A Plex file under `PLEX_URL`, in its package. */
export function plexFile(nodeModules: string, font: string): string {
  const [family, ...rest] = font.split("/");
  return path.join(nodeModules, `@ibm/plex-${family}`, ...rest);
}

/**
 * Copies each Plex file the built page and its sheets name to `outdir`,
 * and restores the preloads' `href`.
 */
export function copyPlexFonts(
  outdir: string,
  nodeModules: string,
  files: string[],
): number {
  const fonts = new Set<string>();
  for (const file of files) {
    if (!/\.(css|html)$/.test(file)) continue;
    let text = fs.readFileSync(file, "utf8");
    if (file.endsWith(".html")) {
      text = text.replaceAll("data-plex-href=", "href=");
      fs.writeFileSync(file, text);
    }
    for (const [, family, rest] of text.matchAll(PLEX_REF)) {
      fonts.add(`${family}/${rest}`);
    }
  }
  for (const font of fonts) {
    const to = path.join(outdir, PLEX_URL, font);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(plexFile(nodeModules, font), to);
  }
  return fonts.size;
}
