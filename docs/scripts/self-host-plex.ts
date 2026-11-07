/**
 * Serves IBM Plex from the site, not from IBM's CDN.
 *
 * The library's theme sheets load Plex from `1.www.s81c.com`, which lets
 * browsers cache it for about 3 days. The site's own assets have hashed
 * names and are cached for a year. This rewrites each Plex URL in the
 * sheets to the same file in `@ibm/plex-sans` and `@ibm/plex-mono`, so
 * Vite emits it as a hashed asset. Version 1.1.0 of both packages has
 * the same bytes as the CDN.
 *
 * The `@font-face` rules keep the family names "IBM Plex Sans" and "IBM
 * Plex Mono", so IBM's footer and TrustArc's cookie banner, which set
 * those names, use the same files.
 */
import path from "node:path";
import type { Plugin } from "vite";

const CDN_RE =
  /https:\/\/1\.www\.s81c\.com\/common\/carbon\/plex\/fonts\/IBM-Plex-(Sans|Mono)\/fonts\//g;

export function selfHostPlex(nodeModules: string): Plugin {
  return {
    name: "self-host-plex",
    // Before Vite's CSS plugin, which resolves and emits each `url()`.
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith(".css")) return;
      const dir = path.dirname(id.split("?")[0]);
      const out = code.replace(CDN_RE, (_, family: string) => {
        const pkg = path.join(nodeModules, `@ibm/plex-${family.toLowerCase()}`);
        return `${path.relative(dir, pkg).split(path.sep).join("/")}/fonts/`;
      });
      return out === code ? undefined : out;
    },
  };
}
