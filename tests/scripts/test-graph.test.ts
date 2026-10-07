import {
  affectedBy,
  BARREL,
  buildGraph,
  changedBarrelNames,
  formatSelection,
  globToRegExp,
  type ParseContext,
  parseBarrel,
  parseDependencies,
  planTests,
} from "../../scripts/lib/test-graph";

const BARREL_SOURCE = `
export { default as Accordion } from "./Accordion/Accordion.svelte";
export { default as Button } from "./Button/Button.svelte";
export {
  default as Modal,
  ModalHeader as Header,
} from "./Modal/Modal.svelte";
`;

/** A small repo: Modal composes Button; fixtures pull all.css. */
const REPO: Record<string, string> = {
  [BARREL]: BARREL_SOURCE,
  "src/Accordion/Accordion.svelte": `<script>\n  import { uid } from "../utils/uid.js";\n</script>`,
  "src/Button/Button.svelte": `<script>\n  import { uid } from "../utils/uid.js";\n</script>`,
  "src/Modal/Modal.svelte": `<script>\n  import Button from "../Button/Button.svelte";\n</script>`,
  "src/utils/uid.js": "export const uid = () => 1;",
  "src/types.d.ts": "export {};",
  "css/all.scss": `@import "button";`,
  "css/_button.scss": ".bx--btn {}",
  "tests/setup-tests.ts": `import "@testing-library/jest-dom/vitest";`,
  "tests/user.ts": "export const user = {};",
  "tests/Accordion/Accordion.test.ts": `import Accordion from "../Accordion/Accordion.test.svelte";`,
  "tests/Accordion/Accordion.test.svelte": `<script>\n  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";\n</script>`,
  "tests/Button/Button.test.ts": `import Button from "carbon-components-svelte/Button/Button.svelte";\nimport { user } from "../user";`,
  "tests/Modal/Modal.test.ts": `import { Modal } from "carbon-components-svelte";`,
  "tests/css/button.test.ts": `import { readFileSync } from "node:fs";\n// @depends-on css/_button.scss`,
  "tests/css/unknown.test.ts": `import { readFileSync } from "node:fs";`,
  "e2e/fixtures/mount.ts": `import "carbon-components-svelte/css/all.css";`,
  "e2e/fixtures/accordion.html": `<script type="module" src="./accordion.ts"></script>`,
  "e2e/fixtures/accordion.ts": `import F from "./AccordionFixture.svelte";\nimport { mount } from "./mount";`,
  "e2e/fixtures/AccordionFixture.svelte": `<script>\n  import { Accordion } from "carbon-components-svelte";\n</script>`,
  "e2e/fixtures/modal.html": `<script type="module" src="./modal.ts"></script>`,
  "e2e/fixtures/modal.ts": `import F from "./ModalFixture.svelte";\nimport { mount } from "./mount";`,
  "e2e/fixtures/ModalFixture.svelte": `<script>\n  import { Modal, Header } from "carbon-components-svelte";\n</script>`,
  "e2e/accordion.test.ts": `test("x", async ({ page }) => {\n  await page.goto("/accordion.html");\n});`,
  "e2e/modal.test.ts": `test("x", async ({ page }) => {\n  await page.goto("/modal.html?theme=g10");\n});`,
  "e2e/vite.config.ts": `import { defineConfig } from "vite";`,
  "scripts/build-css.ts": `import { watch } from "node:fs";\n// @depends-on css/**`,
  "crassus.config.ts": `import path from "node:path";`,
  "tests/scripts/crassus-config.test.ts": `import config from "../../crassus.config";`,
};

function context(files: Iterable<string> = Object.keys(REPO)): ParseContext {
  const exists = new Set(files);
  return {
    exists: (path) => exists.has(path),
    isExternal: (specifier) =>
      specifier.startsWith("node:") ||
      ["svelte", "vite", "@testing-library/jest-dom"].some(
        (name) => specifier === name || specifier.startsWith(`${name}/`),
      ),
    barrel: parseBarrel(BARREL_SOURCE),
  };
}

function deps(path: string, source: string, files?: string[]) {
  const result = parseDependencies(path, source, context(files));
  return {
    files: [...result.files].sort(),
    patterns: result.patterns.map(String),
    unknown: result.unknown,
  };
}

const graph = buildGraph(new Map(Object.entries(REPO)), context());

function plan(changed: string[], barrelNames?: string[]) {
  const { unit, e2e, reasons } = planTests(graph, changed, barrelNames);
  return { unit: formatSelection(unit), e2e: formatSelection(e2e), reasons };
}

describe("globToRegExp", () => {
  it("matches `**` across directories and `*` within one", () => {
    expect(globToRegExp("css/**").test("css/vendor/a/_b.scss")).toBe(true);
    expect(globToRegExp("**/*.md").test("README.md")).toBe(true);
    expect(globToRegExp("**/*.md").test("docs/a/b.md")).toBe(true);
    expect(globToRegExp("src/*.js").test("src/a/b.js")).toBe(false);
    expect(globToRegExp("src/*.{js,ts}").test("src/a.ts")).toBe(true);
    expect(globToRegExp("a.b").test("axb")).toBe(false);
  });
});

describe("parseBarrel", () => {
  it("maps every exported name, including multi-line and renamed ones", () => {
    expect(Object.fromEntries(parseBarrel(BARREL_SOURCE))).toEqual({
      Accordion: "src/Accordion/Accordion.svelte",
      Button: "src/Button/Button.svelte",
      Modal: "src/Modal/Modal.svelte",
      Header: "src/Modal/Modal.svelte",
    });
  });

  it("reports names added, removed, or retargeted", () => {
    const before = new Map([
      ["A", "src/a.js"],
      ["B", "src/b.js"],
      ["C", "src/c.js"],
    ]);
    const after = new Map([
      ["A", "src/a.js"],
      ["B", "src/b2.js"],
      ["D", "src/d.js"],
    ]);
    expect(changedBarrelNames(before, after).sort()).toEqual(["B", "C", "D"]);
  });
});

describe("parseDependencies", () => {
  it("resolves relative imports by extension and index file", () => {
    expect(
      deps(
        "src/Modal/Modal.svelte",
        `<script>\n  import Button from "../Button/Button.svelte";\n  import { uid } from "../utils/uid";\n</script>`,
      ).files,
    ).toEqual(["src/Button/Button.svelte", "src/utils/uid.js"]);
  });

  it("resolves named barrel imports to the re-exported file", () => {
    expect(
      deps(
        "tests/x.test.ts",
        `import {\n  Accordion,\n  Header as H,\n  type Unknown,\n} from "carbon-components-svelte";`,
      ).files,
    ).toEqual([BARREL, `${BARREL}#Accordion`, `${BARREL}#Header`]);
  });

  it("treats default and namespace barrel imports as the whole barrel", () => {
    expect(
      deps(
        "tests/x.test.ts",
        `import * as All from "carbon-components-svelte";`,
      ).files,
    ).toEqual([BARREL]);
    expect(
      deps(
        "tests/x.test.ts",
        `import All, { Button } from "carbon-components-svelte";`,
      ).files,
    ).toEqual([BARREL]);
  });

  it("resolves the package alias and package-exports subpaths", () => {
    expect(
      deps(
        "tests/x.test-d.ts",
        `import A from "carbon-components-svelte/Button/Button.svelte";\nimport B from "carbon-components-svelte/src/Modal/Modal.svelte";`,
      ).files,
    ).toEqual(["src/Button/Button.svelte", "src/Modal/Modal.svelte"]);
  });

  it("reads side-effect imports, query suffixes, mocks, and literal dynamic imports", () => {
    expect(
      deps(
        "tests/x.test.ts",
        [
          `import "./user";`,
          `import raw from "../src/index.js?raw";`,
          `vi.mock("../src/utils/uid.js", async () => ({}));`,
          "const m = await import(`../src/Button/Button.svelte`);",
          `/** @type {import("svelte").Component} */`,
        ].join("\n"),
      ),
    ).toEqual({
      files: [
        "src/Button/Button.svelte",
        BARREL,
        "src/utils/uid.js",
        "tests/user.ts",
      ],
      patterns: [],
      unknown: [],
    });
  });

  it('ignores `from "…"` in prose and comments', () => {
    expect(
      deps(
        "tests/x.test.ts",
        `it('changes from "multiple" to "single"', () => {});\n// switching from "top" to "bottom"`,
      ),
    ).toEqual({ files: [], patterns: [], unknown: [] });
  });

  it("turns import.meta.glob into a pattern relative to the file", () => {
    expect(
      deps(
        "tests/ssr.test.ts",
        `const m = import.meta.glob<string>("../src/**/*.svelte", { query: "?raw" });`,
      ).patterns,
    ).toEqual([String(globToRegExp("src/**/*.svelte"))]);
  });

  it("flags what it can't read as depending on everything", () => {
    expect(
      deps(
        "tests/x.test.ts",
        [
          `import missing from "./missing";`,
          `import alias from "$lib/thing";`,
          "const m = await import(name);",
          "const g = import.meta.glob(patterns);",
        ].join("\n"),
      ).unknown,
    ).toEqual([
      `unresolved "./missing"`,
      `unresolved "$lib/thing"`,
      "non-literal dynamic import",
      "non-literal glob import",
    ]);
  });

  it("maps e2e page.goto() to the fixture page", () => {
    expect(
      deps(
        "e2e/x.test.ts",
        `await page.goto("/accordion.html#top");\nawait other.goto("about:blank");`,
      ),
    ).toEqual({
      files: ["e2e/fixtures/accordion.html"],
      patterns: [],
      unknown: [],
    });
    expect(deps("e2e/x.test.ts", "await page.goto(url);").unknown).toEqual([
      "non-literal goto(url)",
    ]);
    expect(
      deps("e2e/x.test.ts", `await page.goto("/gone.html");`).unknown,
    ).toEqual([`missing fixture "/gone.html"`]);
  });

  it("reads fixture HTML script sources", () => {
    expect(
      deps(
        "e2e/fixtures/accordion.html",
        `<script type="module" src="./accordion.ts"></script>`,
      ).files,
    ).toEqual(["e2e/fixtures/accordion.ts"]);
  });

  it("requires a @depends-on declaration to read the disk", () => {
    expect(
      deps("tests/x.test.ts", `import { readFileSync } from "node:fs";`)
        .unknown,
    ).toEqual(["reads the disk without @depends-on"]);
    expect(
      deps(
        "tests/x.test.ts",
        `// @depends-on css/** src/*.js\nimport { readFileSync } from "node:fs";`,
      ),
    ).toEqual({
      files: [],
      patterns: [
        String(globToRegExp("css/**")),
        String(globToRegExp("src/*.js")),
      ],
      unknown: [],
    });
  });

  it("builds compiled css from the css tree and its build script", () => {
    expect(deps("css/all.css", "")).toEqual({
      files: ["scripts/build-css.ts"],
      patterns: [String(globToRegExp("css/**"))],
      unknown: [],
    });
  });
});

describe("affectedBy", () => {
  it("walks dependents transitively", () => {
    const affected = affectedBy(graph, ["src/utils/uid.js"]);
    expect(affected.has("src/Modal/Modal.svelte")).toBe(true);
    expect(affected.has("tests/Modal/Modal.test.ts")).toBe(true);
  });

  it("can leave out files with unknown dependencies", () => {
    expect(
      affectedBy(graph, ["src/types.d.ts"]).has("tests/css/unknown.test.ts"),
    ).toBe(true);
    expect(
      affectedBy(graph, ["src/types.d.ts"], { includeUnknown: false }).has(
        "tests/css/unknown.test.ts",
      ),
    ).toBe(false);
  });
});

describe("planTests", () => {
  it("runs a leaf component's tests, fixtures, and unknown-dependency tests", () => {
    expect(plan(["src/Accordion/Accordion.svelte"])).toEqual({
      unit: "tests/Accordion/Accordion.test.ts tests/css/unknown.test.ts",
      e2e: "e2e/accordion.test.ts",
      reasons: [],
    });
  });

  it("runs the tests of every component that composes the changed one", () => {
    expect(plan(["src/Button/Button.svelte"])).toEqual({
      unit: "tests/Button/Button.test.ts tests/Modal/Modal.test.ts tests/css/unknown.test.ts",
      e2e: "e2e/modal.test.ts",
      reasons: [],
    });
  });

  it("selects barrel importers only for barrel names that moved", () => {
    expect(plan([BARREL], ["Header"])).toEqual({
      unit: "tests/css/unknown.test.ts",
      e2e: "e2e/modal.test.ts",
      reasons: [],
    });
  });

  it("runs every e2e test and declared css tests for a stylesheet change", () => {
    expect(plan(["css/_button.scss"])).toEqual({
      unit: "tests/css/button.test.ts tests/css/unknown.test.ts",
      e2e: "all",
      reasons: [],
    });
  });

  it("runs a root-level config's importers, not everything", () => {
    expect(plan(["crassus.config.ts"])).toEqual({
      unit: "tests/css/unknown.test.ts tests/scripts/crassus-config.test.ts",
      e2e: "none",
      reasons: [],
    });
  });

  it("runs a whole suite when its setup file changes", () => {
    expect(plan(["tests/setup-tests.ts"]).unit).toBe("all");
    expect(plan(["e2e/vite.config.ts"]).e2e).toBe("all");
  });

  it("runs everything for files outside the graph and selector changes", () => {
    for (const file of ["package.json", "scripts/lib/test-graph.ts"]) {
      expect(plan([file])).toMatchObject({ unit: "all", e2e: "all" });
    }
    expect(plan(["tests-svelte3/setup-tests.ts"])).toMatchObject({
      unit: "all",
      e2e: "none",
    });
  });

  it("skips ignored files and deleted tests", () => {
    expect(plan(["docs/src/pages/index.svx", "README.md"])).toEqual({
      unit: "none",
      e2e: "none",
      reasons: [],
    });
    expect(plan(["tests/Gone/Gone.test.ts"]).reasons).toEqual([]);
  });

  it("runs a whole suite when a deleted helper leaves no importer", () => {
    expect(plan(["tests/gone-helper.ts"]).unit).toBe("all");
  });
});
