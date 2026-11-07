// @vitest-environment node
// @depends-on tests/fixtures/hydrate/*.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "./utils/hydrate";

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

const COMPONENTS = [
  "AILabel",
  "Button",
  "DataTable",
  "ComboBox",
  "Modal",
  "SidePanel",
] as const;

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
  it("detects a swapped branch that Svelte rebuilds", () => {
    const result = results.ControlStructure;

    expect(result.hydrateError).toBeUndefined();
    expect(result.recovered).toBe(true);
    expect(result.identity.pct).toBe(0);
    expect(result.diffIgnoringIds).not.toEqual([]);
    expect(result.ok).toBe(false);
  });

  it("detects text and attribute drift", () => {
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

  it("detects `{@html}` drift and an extra list item", () => {
    const result = results.ControlHtml;

    expect(result.warnings).toEqual([
      expect.stringMatching(/^\[svelte\] hydration_html_changed The value/),
    ]);
    expect(result.diffIgnoringIds).toContainEqual(
      expect.objectContaining({ kind: "extra", path: "/ul[1]/li[2]" }),
    );
    expect(result.ok).toBe(false);
  });

  it("reports a server render error", () => {
    const result = results.ControlServerCrash;

    expect(result.serverRenderError).toMatch("window is not defined");
    expect(result.ok).toBe(false);
  });

  it("reports a client error during hydration", () => {
    const result = results.ControlClientThrow;

    expect(result.serverRenderError).toBeUndefined();
    expect(result.hydrateError).toMatch("boom on client");
    expect(result.ok).toBe(false);
  });

  it("ignores regenerated random ids that stay paired", () => {
    const result = results.ControlId;

    expect(result.idChanges).toBe(4);
    expect(result.diff).toHaveLength(4);
    expect(result.diffIgnoringIds).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("fails on an id reference that matches nothing", () => {
    const result = results.ControlBrokenRef;

    expect(result.diffIgnoringIds).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([
      { element: "div", attr: "aria-labelledby", token: "missing" },
    ]);
    expect(result.ok).toBe(false);
  });

  it("counts an element moved out of the target as preserved", () => {
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

// ActionSet counts its buttons after mount, so its `--row-*` class is
// missing from the server HTML. Two filled buttons lay out the same
// either way; ghost buttons move. Remove this entry once ActionSet
// derives the class without measuring.
const KNOWN_DRIFT: Partial<Record<Name, string[]>> = {
  SidePanel: ["bx--action-set--row-double"],
};

describe.each(COMPONENTS)("%s", (name) => {
  it("hydrates without warnings, rebuilt nodes, drift or a later change", () => {
    const result = results[name];
    const known = KNOWN_DRIFT[name] ?? [];
    const drift = result.diffIgnoringIds.filter(
      (entry) =>
        !known.some(
          (token) =>
            entry.kind === "attr" &&
            entry.after?.replace(` ${token}`, "") === entry.before,
        ),
    );

    expect(result.serverRenderError).toBeUndefined();
    expect(result.hydrateError).toBeUndefined();
    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(result.identity.replaced).toEqual([]);
    expect(result.identity.pct).toBe(100);
    expect(drift).toEqual([]);
    expect(result.settledDiff).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([]);
  });
});
