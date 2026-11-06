// @vitest-environment node
// @depends-on src/QRCode/QRCode.svelte tests/fixtures/hydrate/QRCode.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixture } from "../utils/hydrate";

const path = (relative: string) =>
  fileURLToPath(new URL(relative, import.meta.url));
const svgOf = (html: string) =>
  /<svg\b[^>]*bx--qr-code__svg[^>]*>[\s\S]*?<\/svg>/.exec(html)?.[0] ?? "";
// The description points at a random id, the only part that may differ.
const withoutId = (svg: string) => svg.replace(/ccs-[a-z0-9]+/g, "ID");

describe.each([
  [
    "QRCode",
    path("../../src/QRCode/QRCode.svelte"),
    { value: "https://example.com/pair?code=123456" },
  ],
  ["QRCode with a logo", path("../fixtures/hydrate/QRCode.svelte"), {}],
])("%s", (_, fixture, props) => {
  it("hydrates onto the server markup and keeps the same SVG", async () => {
    const result = await hydrateFixture(fixture, props);

    expect(result.serverRenderError).toBeUndefined();
    expect(result.hydrateError).toBeUndefined();
    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(result.identity.pct).toBe(100);
    expect(result.diffIgnoringIds).toEqual([]);
    expect(svgOf(result.serverHtml)).toContain("<path");
    expect(withoutId(svgOf(result.settledHtml))).toBe(
      withoutId(svgOf(result.serverHtml)),
    );
    expect(result.brokenRefs.settled).toEqual([]);
  });
});
