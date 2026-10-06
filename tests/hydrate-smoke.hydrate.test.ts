// @vitest-environment node
import { fileURLToPath } from "node:url";
import { type HydrateResult, hydrateFixtures } from "./utils/hydrate";

const CONTROLS = [
  "ControlStructure",
  "ControlText",
  "ControlHtml",
  "ControlServerCrash",
  "ControlClientThrow",
  "ControlId",
  "ControlMoved",
  "ControlBrokenRef",
] as const;

const COMPONENTS = ["Button", "DataTable", "ComboBox", "Modal"] as const;

type Name = (typeof CONTROLS)[number] | (typeof COMPONENTS)[number];

const fixture = (name: Name) =>
  fileURLToPath(new URL(`./fixtures/hydrate/${name}.svelte`, import.meta.url));

let results: Record<Name, HydrateResult>;

beforeAll(async () => {
  const names = [...CONTROLS, ...COMPONENTS];
  const list = await hydrateFixtures(
    names.map((name) => ({ fixture: fixture(name) })),
  );
  results = Object.fromEntries(
    names.map((name, i) => [name, list[i]]),
  ) as Record<Name, HydrateResult>;
}, 120_000);

describe("harness controls", () => {
  test("detects a swapped branch that Svelte rebuilds", () => {
    const result = results.ControlStructure;

    expect(result.hydrateError).toBeUndefined();
    expect(result.recovered).toBe(true);
    expect(result.identity.pct).toBe(0);
    expect(result.diffIgnoringIds).not.toEqual([]);
    expect(result.ok).toBe(false);
  });

  test("detects text and attribute drift", () => {
    const result = results.ControlText;

    expect(result.identity.pct).toBe(100);
    expect(result.diffIgnoringIds).toEqual([
      {
        path: "/p[0]/#text[0]",
        kind: "text",
        before: "server",
        after: "client",
      },
      {
        path: "/a[1]",
        kind: "attr",
        before: "href=/server",
        after: "href=/client",
      },
      {
        path: "/p[2]",
        kind: "attr",
        before: "class=server",
        after: "class=client",
      },
    ]);
    expect(result.ok).toBe(false);
  });

  test("detects `{@html}` drift and an extra list item", () => {
    const result = results.ControlHtml;

    expect(result.warnings).toEqual([
      expect.stringMatching(/^\[svelte\] hydration_html_changed The value/),
    ]);
    expect(result.diffIgnoringIds).toContainEqual(
      expect.objectContaining({ kind: "extra", path: "/ul[1]/li[2]" }),
    );
    expect(result.ok).toBe(false);
  });

  test("reports a server render error", () => {
    const result = results.ControlServerCrash;

    expect(result.serverRenderError).toMatch("window is not defined");
    expect(result.ok).toBe(false);
  });

  test("reports a client error during hydration", () => {
    const result = results.ControlClientThrow;

    expect(result.serverRenderError).toBeUndefined();
    expect(result.hydrateError).toMatch("boom on client");
    expect(result.ok).toBe(false);
  });

  test("ignores regenerated random ids that stay paired", () => {
    const result = results.ControlId;

    expect(result.idChanges).toBe(4);
    expect(result.diff).toHaveLength(4);
    expect(result.diffIgnoringIds).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([]);
    expect(result.ok).toBe(true);
  });

  test("fails on an id reference that matches nothing", () => {
    const result = results.ControlBrokenRef;

    expect(result.diffIgnoringIds).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([
      { element: "div", attr: "aria-labelledby", token: "missing" },
    ]);
    expect(result.ok).toBe(false);
  });

  test("counts an element moved out of the target as preserved", () => {
    const result = results.ControlMoved;

    expect(result.serverHtml).toContain("data-moved");
    expect(result.hydratedHtml).not.toContain("data-moved");
    expect(result.identity).toEqual({
      serverElements: 3,
      preserved: 3,
      pct: 100,
      replaced: [],
    });
  });
});

describe.each(COMPONENTS)("%s", (name) => {
  test("hydrates without warnings, rebuilt nodes or drift", () => {
    const result = results[name];

    expect(result.serverRenderError).toBeUndefined();
    expect(result.hydrateError).toBeUndefined();
    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(result.identity.replaced).toEqual([]);
    expect(result.identity.pct).toBe(100);
    expect(result.diffIgnoringIds).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([]);
  });
});
