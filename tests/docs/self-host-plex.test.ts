// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  copyPlexFonts,
  PLEX_URL,
  rewritePlexUrls,
} from "../../docs/scripts/self-host-plex";

const CDN = "https://1.www.s81c.com/common/carbon/plex/fonts";

describe("rewritePlexUrls", () => {
  it("points Sans and Mono at the site, and leaves Serif on the CDN", () => {
    const css = [
      `url(${CDN}/IBM-Plex-Sans/fonts/split/woff2/IBMPlexSans-Regular-Latin1.woff2)`,
      `url(${CDN}/IBM-Plex-Mono/fonts/complete/woff2/IBMPlexMono-Bold.woff2)`,
      `url(${CDN}/IBM-Plex-Serif/fonts/complete/woff2/IBMPlexSerif-Light.woff2)`,
    ].join("\n");
    expect(rewritePlexUrls(css, (family) => `/plex/${family}/fonts/`)).toBe(
      [
        "url(/plex/sans/fonts/split/woff2/IBMPlexSans-Regular-Latin1.woff2)",
        "url(/plex/mono/fonts/complete/woff2/IBMPlexMono-Bold.woff2)",
        `url(${CDN}/IBM-Plex-Serif/fonts/complete/woff2/IBMPlexSerif-Light.woff2)`,
      ].join("\n"),
    );
  });
});

describe("copyPlexFonts", () => {
  it("copies the fonts the output names, and restores the preloads", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ccs-plex-"));
    const nodeModules = path.join(root, "node_modules");
    const font = "fonts/split/woff2/IBMPlexSans-Regular-Latin1.woff2";
    fs.mkdirSync(path.dirname(path.join(nodeModules, "@ibm/plex-sans", font)), {
      recursive: true,
    });
    fs.writeFileSync(path.join(nodeModules, "@ibm/plex-sans", font), "woff2");
    const outdir = path.join(root, "dist");
    fs.mkdirSync(outdir);
    const html = path.join(outdir, "index.html");
    fs.writeFileSync(
      html,
      `<link rel="preload" data-plex-href="${PLEX_URL}/sans/${font}">`,
    );
    const css = path.join(outdir, "index.css");
    fs.writeFileSync(css, `src:url(${PLEX_URL}/sans/${font})`);
    try {
      expect(copyPlexFonts(outdir, nodeModules, [html, css])).toBe(1);
      expect(fs.readFileSync(html, "utf8")).toBe(
        `<link rel="preload" href="${PLEX_URL}/sans/${font}">`,
      );
      expect(
        fs.readFileSync(path.join(outdir, PLEX_URL, "sans", font), "utf8"),
      ).toBe("woff2");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
