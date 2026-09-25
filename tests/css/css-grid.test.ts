// @vitest-environment node
import { compileEntry } from "./compile";

describe("css grid", () => {
  it("generates the base grid, responsive spans, and gutter overrides", async () => {
    const css = await compileEntry("all.scss");

    expect(css).toMatch(
      /\.bx--css-grid\s*\{[^}]*grid-template-columns:\s*repeat\(var\(--ccs-grid-columns\)/,
    );
    expect(css).toMatch(
      /\.bx--css-grid--condensed\s*\{[^}]*--ccs-grid-gutter:\s*0\.0625rem/,
    );
    expect(css).toMatch(
      /\.bx--css-grid--narrow\s*\{[^}]*--ccs-grid-gutter-start:\s*0rem/,
    );

    // md is wrapped in its own @media block; sm is not. The flexbox grid
    // emits 42rem blocks too, so find the one holding the md spans.
    const mdBlocks = [
      ...css.matchAll(/@media \(min-width:\s*42rem\)\s*\{([\s\S]*?)\n\}/g),
    ].map((match) => match[1]);
    expect(
      mdBlocks.some((block) => /\.bx--md\\:col-span-4\s*\{/.test(block)),
    ).toBe(true);
    expect(css).toMatch(/\.bx--sm\\:col-span-1\s*\{/);
    expect(css).not.toMatch(/@media[^{]*\{\s*\.bx--sm\\:col-span-1/);

    expect(css).toMatch(/\.bx--col-span-0\s*\{\s*display:\s*none;/);
    expect(css).toMatch(
      /\.bx--css-grid--narrow\.bx--css-grid--with-row-gap\s*\{[^}]*row-gap:\s*calc\(var\(--ccs-grid-gutter\)\s*\/\s*2\)/,
    );
  }, 30_000);

  it("generates per-breakpoint percent spans and the flat col-start/col-end range", async () => {
    const css = await compileEntry("all.scss");

    // Percent spans resolve against each breakpoint's own column count:
    // md (8 cols) 50% -> 4, lg (16 cols) 50% -> 8.
    expect(css).toMatch(
      /\.bx--md\\:col-span-50\s*\{[^}]*--ccs-grid-columns:\s*4;[^}]*grid-column:\s*span 4\s*\/\s*span 4/,
    );
    expect(css).toMatch(
      /\.bx--lg\\:col-span-50\s*\{[^}]*--ccs-grid-columns:\s*8;[^}]*grid-column:\s*span 8\s*\/\s*span 8/,
    );
    expect(css).toMatch(
      /\.bx--md\\:col-span-100\s*\{\s*grid-column:\s*1\s*\/\s*-1;/,
    );

    // sm gets the full percent family too, unwrapped by @media.
    expect(css).toMatch(/\.bx--sm\\:col-span-25\s*\{/);

    // col-start/col-end are not capped by a breakpoint's own column count.
    expect(css).toMatch(/\.bx--sm\\:col-start-16\s*\{/);
    expect(css).toMatch(/\.bx--md\\:col-end-17\s*\{/);
  }, 30_000);

  it("re-resolves the unprefixed percent spans where the column count changes", async () => {
    const css = await compileEntry("all.scss");

    // span="50%" is half the grid at every width, like upstream: 2 of 4
    // columns at sm, 4 of 8 at md, 8 of 16 at lg.
    const spans = [
      ...css.matchAll(/\.bx--col-span-50\s*\{\s*--ccs-grid-columns:\s*(\d+);/g),
    ].map((match) => match[1]);
    expect(spans).toEqual(["2", "4", "8"]);
  }, 30_000);

  it("emits every span rule before any start/end rule", async () => {
    const css = await compileEntry("all.scss");

    // `grid-column: span N` also sets grid-column-start, so a col-start
    // class only survives alongside a col-span class when it comes later.
    const lastSpan = css.lastIndexOf("col-span-");
    const firstStart = css.search(/\.bx--(?:[a-z]+\\:)?col-start-/);
    expect(firstStart).toBeGreaterThan(lastSpan);
  }, 30_000);

  it("generates subgrid rules that consume css-grid's mode custom properties", async () => {
    const css = await compileEntry("all.scss");

    expect(css).toMatch(
      /\.bx--subgrid\s*\{[^}]*margin-inline:\s*calc\(var\(--ccs-grid-mode-start\)/,
    );
    expect(css).toMatch(
      /\.bx--subgrid--condensed\s*\{[^}]*--ccs-grid-column-hang:\s*0\.96875rem/,
    );
    expect(css).toMatch(
      /\.bx--subgrid--narrow\.bx--subgrid--with-row-gap\s*\{[^}]*row-gap:\s*1rem/,
    );
  }, 30_000);
});
