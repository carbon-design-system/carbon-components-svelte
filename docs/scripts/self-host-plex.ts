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
 * Bun inlines a font a stylesheet's `url()` names as base64, whatever its
 * loader, which would add 2 MB to the sheet. So the build points the
 * sheets at `PLEX_URL`, marks it external, and copies the fonts there
 * (`copyPlexFonts`); the path is versioned since the copies aren't
 * content-hashed. The dev server keeps them inline, from paths relative
 * to each sheet.
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

export function selfHostPlex(options: {
  nodeModules: string;
  build: boolean;
}): BunPlugin {
  const pkg = (family: string) =>
    path.join(options.nodeModules, `@ibm/plex-${family}`);
  return {
    name: "self-host-plex",
    setup(build) {
      build.onLoad({ filter: /[\\/]css[\\/][^\\/]+\.css$/ }, (args) => {
        const css = fs.readFileSync(args.path, "utf8");
        const out = rewritePlexUrls(css, (family) =>
          options.build
            ? `${PLEX_URL}/${family}/fonts/`
            : `${path.relative(path.dirname(args.path), pkg(family)).split(path.sep).join("/")}/fonts/`,
        );
        return out === css ? undefined : { contents: out, loader: "css" };
      });
      if (!options.build) return;
      // Bun would resolve each preload to a hashed copy of its own.
      // `copyPlexFonts` restores the `href`.
      build.onLoad({ filter: /[\\/]docs[\\/]index\.html$/ }, (args) => ({
        contents: fs
          .readFileSync(args.path, "utf8")
          .replace(PRELOAD_RE, `data-plex-href="${PLEX_URL}/$1/`),
        loader: "html",
      }));
    },
  };
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
    const [family, ...rest] = font.split("/");
    const to = path.join(outdir, PLEX_URL, font);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(nodeModules, `@ibm/plex-${family}`, ...rest), to);
  }
  return fonts.size;
}
