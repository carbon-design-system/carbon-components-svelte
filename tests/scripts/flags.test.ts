// @vitest-environment node
// @depends-on scripts/build-flags.ts scripts/lib/flags.ts scripts/flags/** src/flags/**
import { readFileSync } from "node:fs";
import { flagFiles } from "../../scripts/build-flags";
import { ALIAS, EMBLEM, HELD, PARAMETRIC } from "../../scripts/flags/coverage";
import { REGIONS } from "../../scripts/flags/regions";
import { SPEC } from "../../scripts/flags/spec";
import { compileFlag, PALETTE } from "../../scripts/lib/flags";

const read = (name: string) =>
  readFileSync(new URL(`../../src/flags/${name}`, import.meta.url), "utf8");

const compile = (spec: Parameters<typeof compileFlag>[0]) =>
  compileFlag(spec, (code) => SPEC[code]).body;

describe("flag generator", () => {
  it("has written src/flags from the specs", () => {
    const { js, dts, allJs, allDts } = flagFiles();

    expect(read("index.js")).toBe(js);
    expect(read("index.d.ts")).toBe(dts);
    expect(read("all.js")).toBe(allJs);
    expect(read("all.d.ts")).toBe(allDts);
  });

  it("draws only regions the picker lists", () => {
    expect(Object.keys(SPEC).filter((code) => !REGIONS.includes(code))).toEqual(
      [],
    );
  });

  it("accounts for every region exactly once", () => {
    const all = [
      ...Object.keys(SPEC),
      ...PARAMETRIC,
      ...Object.keys(ALIAS),
      ...EMBLEM,
      ...HELD,
    ];

    expect([...all].sort()).toEqual([...REGIONS].sort());
    expect(Object.values(ALIAS).filter((code) => !(code in SPEC))).toEqual([]);
  });

  it("paints every flag in the palette, flat, with nothing but paths", () => {
    const palette = new Set<string>(Object.values(PALETTE));

    for (const [code, spec] of Object.entries(SPEC)) {
      const body = compile(spec);
      const fills = [...body.matchAll(/fill="([^"]+)"/g)].map((m) => m[1]);

      expect(fills.length, code).toBeGreaterThan(0);
      expect(
        fills.filter((fill) => !palette.has(fill)),
        code,
      ).toEqual([]);
      // No gradient, stroke, opacity, text or raster, so a flag cannot shade,
      // blur or hold script.
      expect(body, code).not.toMatch(
        /gradient|stroke=|opacity|<text|<image|<style|<script|on\w+=|href/i,
      );
      expect(body.replace(/<\/?(path|g)[^>]*>/g, ""), code).toBe("");
    }
  });

  it("splits stripes by weight, to the edge of the frame", () => {
    expect(compile([["h", ["red", 2], "white"]])).toBe(
      `<g shape-rendering="crispEdges"><path fill="${PALETTE.red}" d="M0 0h32v16h-32z"/><path fill="#fff" d="M0 16h32v8h-32z"/></g>`,
    );
  });

  it("keeps a saltire inside its box, also in a canton", () => {
    const extent = (body: string) => {
      const data = body.match(/d="([^"]+)"/)?.[1];
      assert(data);
      const numbers = data
        .replace(/[MZz]/g, " ")
        .trim()
        .split(/\s+/)
        .map(Number);
      return {
        x: Math.max(...numbers.filter((_, i) => i % 2 === 0)),
        y: Math.max(...numbers.filter((_, i) => i % 2 === 1)),
      };
    };

    expect(extent(compile([["saltire", "white", 5]]))).toEqual({
      x: 32,
      y: 24,
    });
    expect(
      extent(compile([["canton", 0.5, 0.5, [["saltire", "white", 5]]]])),
    ).toEqual({ x: 16, y: 12 });
  });

  it("refuses a path outside the full frame", () => {
    expect(() =>
      compile([["canton", 0.5, 0.5, [["path", "red", "M0 0h1v1z"]]]]),
    ).toThrow("full frame");
  });
});
