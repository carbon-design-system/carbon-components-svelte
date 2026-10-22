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
  type StyleSeeds,
  stylesheetEntries,
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

function plan(changed: string[], barrelNames?: string[], styles?: StyleSeeds) {
  const { unit, e2e, reasons } = planTests(graph, changed, barrelNames, styles);
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

  it("resolves a JSDoc type import to a declaration file", () => {
    expect(
      deps(
        "src/Modal/Modal.svelte",
        `<script>\n  /** @typedef {import("../types").Type} Type */\n</script>`,
      ).files,
    ).toEqual(["src/types.d.ts"]);
  });

  it("resolves named barrel imports to the re-exported file", () => {
    expect(
      deps(
        "tests/x.test.ts",
        `import {\n  Accordion,\n  Header as H,\n  type Button,\n} from "carbon-components-svelte";`,
      ).files,
    ).toEqual([`${BARREL}#Accordion`, `${BARREL}#Button`, `${BARREL}#Header`]);
  });

  it("falls back to the whole barrel for a name it doesn't export", () => {
    expect(
      deps(
        "tests/x.test.ts",
        `import { Accordion, Unknown } from "carbon-components-svelte";`,
      ).files,
    ).toEqual([BARREL, `${BARREL}#Accordion`]);
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

  it.each([
    // biome-ignore lint/suspicious/noTemplateCurlyInString: source text
    "const m = await import(`./x/${name}.svelte`);",
    // biome-ignore lint/suspicious/noTemplateCurlyInString: source text
    "const m = require(`./${name}`);",
    // biome-ignore lint/suspicious/noTemplateCurlyInString: source text
    "vi.mock(`./${name}`);",
  ])("flags a templated module path as unreadable: %s", (source) => {
    expect(deps("tests/x.test.ts", source).unknown).toEqual([
      "non-literal dynamic import",
    ]);
  });

  it("reads a glob whose type argument nests generics", () => {
    expect(
      deps(
        "tests/ssr.test.ts",
        `const m = import.meta.glob<Record<string, string>>("../src/**/*.svelte");`,
      ),
    ).toEqual({
      files: [],
      patterns: [String(globToRegExp("src/**/*.svelte"))],
      unknown: [],
    });
  });

  it("reads an import on the same line as <script>", () => {
    expect(
      deps(
        "e2e/fixtures/ModalFixture.svelte",
        `<script>import { user } from "../../tests/user";</script>`,
      ).files,
    ).toEqual(["tests/user.ts"]);
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
    // biome-ignore lint/suspicious/noTemplateCurlyInString: source text
    const staticPath = "`/accordion.html?v=${v}`";
    expect(deps("e2e/x.test.ts", `await page.goto(${staticPath});`)).toEqual({
      files: ["e2e/fixtures/accordion.html"],
      patterns: [],
      unknown: [],
    });
    expect(deps("e2e/x.test.ts", "await page.goto(url);").unknown).toEqual([
      "non-literal goto(url)",
    ]);
    // biome-ignore lint/suspicious/noTemplateCurlyInString: source text
    const dynamicPath = "`/${name}.html?v=1`";
    expect(
      deps("e2e/x.test.ts", `await page.goto(${dynamicPath});`).unknown,
    ).toEqual([`non-literal goto(${dynamicPath})`]);
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

  it("reads fixture HTML iframe sources", () => {
    expect(
      deps(
        "e2e/fixtures/accordion-framed.html",
        `<iframe title="demo" src="./accordion.html"></iframe>`,
        [...Object.keys(REPO), "e2e/fixtures/accordion-framed.html"],
      ).files,
    ).toEqual(["e2e/fixtures/accordion.html"]);
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

  it("keeps a brace list in @depends-on as one glob", () => {
    expect(
      deps(
        "tests/x.test.ts",
        `// @depends-on src/*.{js,ts} css/**\nimport { readFileSync } from "node:fs";`,
      ).patterns,
    ).toEqual([
      String(globToRegExp("src/*.{js,ts}")),
      String(globToRegExp("css/**")),
    ]);
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

describe("directives", () => {
  // A host page globs every fixture but each test names its own, and its
  // helper reads entries as text: neither may widen a fixture change.
  const files = {
    ...REPO,
    "e2e/fixtures/host.ts": `// @glob-registry\nconst fixtures = import.meta.glob("./*Fixture.svelte");`,
    "e2e/fixtures/host.html": `<script type="module" src="./host.ts"></script>`,
    "e2e/helpers/host.ts": `import { readFileSync } from "node:fs";\n// @reads e2e/fixtures/*.ts\nawait page.goto("/host.html");`,
    "e2e/hosted.test.ts": `import { test } from "./helpers/host";\nawait page.goto("/accordion.html");`,
  };
  const hosted = buildGraph(
    new Map(Object.entries(files)),
    context(Object.keys(files)),
  );

  it("@glob-registry adds no edges from the glob", () => {
    expect(
      deps(
        "e2e/fixtures/host.ts",
        files["e2e/fixtures/host.ts"],
        Object.keys(files),
      ).patterns,
    ).toEqual([]);
    expect(affectedBy(hosted, ["src/Modal/Modal.svelte"])).not.toContain(
      "e2e/hosted.test.ts",
    );
  });

  it("@reads counts only a direct change to a read file", () => {
    expect(
      deps(
        "e2e/helpers/host.ts",
        files["e2e/helpers/host.ts"],
        Object.keys(files),
      ).unknown,
    ).toEqual([]);
    expect(affectedBy(hosted, ["e2e/fixtures/modal.ts"])).toContain(
      "e2e/hosted.test.ts",
    );
    // modal.ts imports ModalFixture, but the helper only reads modal.ts.
    expect(
      affectedBy(hosted, ["e2e/fixtures/ModalFixture.svelte"]),
    ).not.toContain("e2e/hosted.test.ts");
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

  it("narrows a stylesheet change to the pages that render its classes", () => {
    const styles = { files: ["src/Accordion/Accordion.svelte"] };
    expect(plan(["css/_button.scss"], [], styles)).toEqual({
      unit: "tests/css/button.test.ts tests/css/unknown.test.ts",
      e2e: "e2e/accordion.test.ts",
      reasons: [],
    });
    expect(plan(["css/_button.scss"], [], { files: [] }).e2e).toBe("none");
    // A build script change still reaches every page through all.css.
    expect(
      plan(["css/_button.scss", "scripts/build-css.ts"], [], { files: [] }).e2e,
    ).toBe("all");
  });

  it("runs every e2e test when a stylesheet change can't be narrowed", () => {
    expect(
      plan(["css/_button.scss"], [], { reason: "`:root` changed" }),
    ).toEqual({
      unit: "tests/css/button.test.ts tests/css/unknown.test.ts",
      e2e: "all",
      reasons: ["css/: `:root` changed"],
    });
  });

  it("runs an e2e test that loads no stylesheet when a change can't be narrowed", () => {
    const sources = new Map(Object.entries(REPO));
    sources.set(
      "e2e/fixtures/plain.html",
      `<script type="module" src="./plain.ts"></script>`,
    );
    sources.set("e2e/fixtures/plain.ts", `document.body.append("plain");`);
    sources.set(
      "e2e/plain.test.ts",
      `test("x", async ({ page }) => {\n  await page.goto("/plain.html");\n});`,
    );
    const { e2e } = planTests(
      buildGraph(sources, context(sources.keys())),
      ["css/_button.scss"],
      [],
      { reason: "`:root` changed" },
    );
    expect(formatSelection(e2e)).toBe("all");
  });

  it("lists the compiled stylesheets the graph imports", () => {
    expect(stylesheetEntries(graph)).toEqual(["all"]);
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
