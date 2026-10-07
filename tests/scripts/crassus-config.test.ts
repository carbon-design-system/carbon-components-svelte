// @vitest-environment node
// @depends-on css/** crassus.config.ts
import path from "node:path";
import config from "../../crassus.config";

describe("crassus.config", () => {
  it("compiles the entries `dead --fix` asks for, with a source map", async () => {
    assert(config.compile);
    // The repo root, also when the Svelte 3/4 harnesses run from their own
    // directories.
    const sheets = await config.compile(path.join(__dirname, "../.."), {
      entries: ["g10"],
    });
    expect(Object.keys(sheets)).toEqual(["g10"]);
    expect(sheets.g10.css).toContain(".bx--btn");
    expect(sheets.g10.map).toBeDefined();
  }, 60_000);

  it("proves fixes against every theme", () => {
    expect(config.fixEntries).toEqual(["g10", "g80", "g90", "g100"]);
  });
});
