import { affectedBy, planTests } from "../../scripts/lib/test-graph";
import { loadGraph } from "../../scripts/test-changed";

const graph = loadGraph();
const isTest = (file: string) => /^(?:tests|e2e)\/.+\.test\.ts$/.test(file);

describe("repo test graph", () => {
  // An unreadable dependency makes a test run on every change. That's safe
  // but slow, so keep the graph fully readable from every test file except
  // the selector's own tests: one reads the whole repo, the other holds
  // import-like fixture strings.
  it("reads every test's dependencies", () => {
    const alwaysRun = [
      "scripts/test-changed.ts",
      "tests/scripts/test-graph.test.ts",
    ];
    const unreadable = [...graph]
      .filter(
        ([file, deps]) => deps.unknown.length > 0 && !alwaysRun.includes(file),
      )
      .filter(([file]) =>
        [...affectedBy(graph, [file], { includeUnknown: false })].some(isTest),
      )
      .map(([file, deps]) => `${file}: ${deps.unknown.join(", ")}`);
    expect(unreadable).toEqual([]);
  });

  it("runs the tests of components that compose a changed one", () => {
    const { unit, e2e } = planTests(graph, ["src/Button/Button.svelte"]);
    expect(unit.mode).toBe("some");
    expect(e2e.mode).toBe("some");
    if (unit.mode !== "some" || e2e.mode !== "some") return;
    expect(unit.files).toContain("tests/Button/Button.test.ts");
    expect(unit.files).toContain("tests/Modal/Modal.test.ts");
    expect(unit.files).not.toContain("tests/AspectRatio/AspectRatio.test.ts");
    expect(e2e.files).toContain("e2e/a11y-button.test.ts");
    expect(e2e.files).not.toContain("e2e/accordion.test.ts");
  });
});
