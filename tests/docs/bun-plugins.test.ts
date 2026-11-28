// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expandGlobs } from "../../docs/scripts/bun-plugins";

describe("expandGlobs", () => {
  let dir: string;
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "ccs-glob-"));
    for (const file of [
      "pages/index.svelte",
      "pages/_module.svelte",
      "pages/guide.md",
      "pages/components/Button.md",
      "pages/framed/Button/ButtonBasic.svelte",
    ]) {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), "");
    }
  });
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("maps each match, sorted, to a lazy import, minus the exclusions", () => {
    const code = `const pages = import.meta.glob<{ default: Component }>([
  "./pages/**/*.svelte",
  "./pages/**/*.md",
  "!./pages/**/_*.svelte",
  "!./pages/framed/**",
]);`;
    expect(expandGlobs(code, path.join(dir, "router.ts")))
      .toBe(`const pages = ({
"./pages/components/Button.md": () => import("./pages/components/Button.md"),
"./pages/guide.md": () => import("./pages/guide.md"),
"./pages/index.svelte": () => import("./pages/index.svelte")
});`);
  });

  it("leaves code without a glob alone", () => {
    const code = `export const x = import.meta.url;`;
    expect(expandGlobs(code, path.join(dir, "x.ts"))).toBe(code);
  });
});
