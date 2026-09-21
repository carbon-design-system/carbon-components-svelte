import { classifyChanges } from "../../scripts/test-changed";

describe("classifyChanges", () => {
  it("skips when nothing changed", () => {
    expect(classifyChanges([])).toEqual({ mode: "skip" });
  });

  it("scopes to the changed component's directory", () => {
    expect(
      classifyChanges([
        "src/UIShell/SideNav.svelte",
        "tests/UIShell/HeaderNav.test.ts",
      ]),
    ).toEqual({ mode: "scoped", dirs: ["UIShell"] });
  });

  it("scopes to multiple changed component directories", () => {
    const result = classifyChanges([
      "src/Accordion/Accordion.svelte",
      "src/BigNumber/BigNumber.svelte",
    ]);
    expect(result.mode).toBe("scoped");
    expect((result as { dirs: string[] }).dirs.sort()).toEqual([
      "Accordion",
      "BigNumber",
    ]);
  });

  it("falls back to a full run for a top-level src file (barrel)", () => {
    expect(classifyChanges(["src/index.js"])).toEqual({ mode: "full" });
  });

  it("falls back to a full run for shared src/utils changes", () => {
    expect(classifyChanges(["src/utils/deep-equal.js"])).toEqual({
      mode: "full",
    });
  });

  it("falls back to a full run for top-level tests files", () => {
    expect(classifyChanges(["tests/setup-tests.ts"])).toEqual({ mode: "full" });
  });

  it("falls back to a full run for files outside src/ and tests/", () => {
    expect(classifyChanges(["package.json"])).toEqual({ mode: "full" });
    expect(classifyChanges(["css/_button.scss"])).toEqual({ mode: "full" });
  });
});
