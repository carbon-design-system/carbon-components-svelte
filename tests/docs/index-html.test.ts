// @vitest-environment node
// @reads docs/index.html
import fs from "node:fs";
import path from "node:path";
import { platformScript } from "../../src/utils/keyboard-shortcut.js";

/** The same code reads the same once minified, however it's formatted. */
const minify = (code: string) =>
  new Bun.Transpiler({ loader: "js", minifyWhitespace: true }).transformSync(
    code,
  );

/** The inline scripts' code, as an HTML parser reads it. */
async function inlineScripts(html: string) {
  const scripts: string[] = [];
  await new HTMLRewriter()
    .on("script:not([src])", {
      element() {
        scripts.push("");
      },
      text({ text }) {
        scripts[scripts.length - 1] += text;
      },
    })
    .transform(new Response(html))
    .text();
  return scripts;
}

describe("docs/index.html", () => {
  it("inlines the current platform script", async () => {
    const html = fs.readFileSync(
      path.resolve(import.meta.dirname, "../../docs/index.html"),
      "utf8",
    );
    const scripts = (await inlineScripts(html)).map(minify);
    expect(scripts).toContain(minify(platformScript()));
  });
});
