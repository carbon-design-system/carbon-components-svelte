// @vitest-environment node
// @depends-on src/Theme/carbon-tokens.d.ts
import { readFileSync } from "node:fs";
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// The Theme `tokens` prop is typed by `CarbonToken`, so the union must
// list exactly the tokens all.css declares on :root.
describe("CarbonToken type", () => {
  it("lists every token all.css declares on :root, and no others", async () => {
    const css = await compileEntry("all.scss");
    const declared = new Set(
      parseRules(css)
        .filter((r) => r.selector.startsWith(":root") && r.context === "")
        .flatMap((r) => [...r.decls.keys()])
        .filter((prop) => prop.startsWith("--cds-"))
        // crassus lowercases property names (`size-2XLarge`).
        .map((prop) => prop.slice("--cds-".length).toLowerCase()),
    );
    const typed = new Set(
      [
        ...readFileSync("src/Theme/carbon-tokens.d.ts", "utf8").matchAll(
          /\| "([\w-]+)"/g,
        ),
      ].map(([, name]) => name.toLowerCase()),
    );
    expect([...declared].filter((name) => !typed.has(name)).sort()).toEqual([]);
    expect([...typed].filter((name) => !declared.has(name)).sort()).toEqual([]);
  }, 30_000);
});
