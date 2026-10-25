// @vitest-environment node
import {
  affectedBy,
  type FileDeps,
  planTests,
} from "../../scripts/lib/test-graph";
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

  it("runs the DatePicker examples e2e test when DatePicker changes", () => {
    const { e2e } = planTests(graph, ["src/DatePicker/DatePicker.svelte"]);
    expect(e2e.mode).toBe("some");
    if (e2e.mode !== "some") return;
    expect(e2e.files).toContain("e2e/date-picker-examples.test.ts");
  });
});

describe("declared dependencies", () => {
  // The graph lists every file under the roots it reads, which is where a
  // test's globs have to land.
  const tracked = [...graph.keys()];

  // `planTests` skips an ignored file, so a lone test that depends on it
  // is the one that stays unselected.
  const ignored = new Map<string, boolean>();
  const isIgnored = (file: string) => {
    if (!ignored.has(file)) {
      const probe = new Map<string, FileDeps>([
        [
          "tests/probe.test.ts",
          { files: new Set([file]), patterns: [], reads: [], unknown: [] },
        ],
      ]);
      ignored.set(file, planTests(probe, [file]).unit.mode === "none");
    }
    return ignored.get(file);
  };

  // Globs the selector can't act on, so a change to what they match selects
  // nothing. The docs ones are ignored (docs-only changes skip CI entirely);
  // the lockfile is outside the graph, so a change runs every test instead;
  // the CSS compile cache is untracked.
  const DEAD_GLOBS = [
    "e2e/date-picker-examples.test.ts depends-on /^docs\\/src\\/pages\\/framed\\/DatePicker\\/[^/]*\\.svelte$/",
    "e2e/fixtures/date-picker-examples.ts depends-on /^docs\\/src\\/pages\\/framed\\/DatePicker\\/[^/]*\\.svelte$/",
    "scripts/lib/css-cache.ts reads /^node_modules\\/\\.cache\\/test-changed-css\\/.*$/",
    "scripts/lib/syntax-tokens.ts depends-on /^bun\\.lock$/",
    "tests/css/v11-tokens.test.ts depends-on /^docs\\/src\\/.*$/",
    "tests/css/v11-tokens.test.ts depends-on /^docs\\/svelte\\.config\\.ts$/",
  ];

  it("points every glob at files that can select its test", () => {
    const dead: string[] = [];
    for (const [file, deps] of graph) {
      // Its fixtures hold `@depends-on` lines as text.
      if (file === "tests/scripts/test-graph.test.ts") continue;
      const globs = [
        ...deps.patterns.map((re) => ["depends-on", re] as const),
        ...deps.reads.map((re) => ["reads", re] as const),
      ];
      for (const [kind, re] of globs) {
        const matches = tracked.filter((path) => re.test(path));
        if (matches.every(isIgnored)) dead.push(`${file} ${kind} ${re}`);
      }
    }
    expect(dead).toEqual(DEAD_GLOBS);
  });
});
