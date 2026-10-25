// @vitest-environment node
// Reads only the temporary directory it writes.
// @depends-on scripts/lib/css-cache.ts
import {
  mkdtempSync,
  readdirSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cachedSheets, KEEP } from "../../scripts/lib/css-cache";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "css-cache-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("cachedSheets", () => {
  it("compiles a key once and reads it back after", async () => {
    const compile = vi.fn(async () => [".a{}", ".b{}"]);
    expect(await cachedSheets(dir, "k", compile)).toEqual([".a{}", ".b{}"]);
    expect(await cachedSheets(dir, "k", compile)).toEqual([".a{}", ".b{}"]);
    expect(compile).toHaveBeenCalledTimes(1);
    await cachedSheets(dir, undefined, compile);
    expect(compile).toHaveBeenCalledTimes(2);
  });

  it("drops the least recently used compiles past the limit", async () => {
    for (let i = 0; i < KEEP; i++) {
      const file = join(dir, `k${i}.json`);
      writeFileSync(file, "[]");
      const at = new Date(Date.now() - (KEEP - i) * 1000);
      utimesSync(file, at, at);
    }
    await cachedSheets(dir, "new", async () => ["new"]);
    const kept = readdirSync(dir);
    expect(kept).toHaveLength(KEEP);
    expect(kept).not.toContain("k0.json");
    expect(kept).toContain("new.json");
  });
});
