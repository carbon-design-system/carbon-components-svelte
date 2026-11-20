// @vitest-environment node
// @depends-on tests/InlineTip/InlineTip.ssr.test.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("./InlineTip.ssr.test.svelte", import.meta.url),
);

// A returning user dismissed the three tips; a new user dismissed none.
const returning = ["filters", "export", "share"];

const scenarios = {
  hideReturning: { stored: returning },
  hideNew: { stored: [] },
  showReturning: { stored: returning, pending: "show" },
  showNew: { stored: [], pending: "show" },
  knownReturning: { stored: returning, initial: returning },
  knownNew: { stored: [], initial: [] },
} as const;

type Name = keyof typeof scenarios;

let results: Record<Name, HydrateResult>;

beforeAll(async () => {
  const names = Object.keys(scenarios) as Name[];
  const list = await hydrateFixtures(
    names.map((name) => ({ fixture, props: { ...scenarios[name] } })),
  );
  results = Object.fromEntries(
    names.map((name, i) => [name, list[i]]),
  ) as Record<Name, HydrateResult>;
}, 120_000);

// `diff` compares the server's HTML with the DOM once `hydrate()` flushes,
// and the flush already runs `onMount`, which reads the storage. So the
// page a visitor sees changes there, between the server's HTML and the
// first interactive state, and `settledDiff` stays empty.
describe("InlineTip hydration", () => {
  it("hides the tips for a returning user with nothing to change", () => {
    expect(results.hideReturning.diffIgnoringIds).toEqual([]);
    expect(results.hideReturning.settledDiff).toEqual([]);
  });

  it("adds the tips for a new user at hydration, when it waits for storage", () => {
    const result = results.hideNew;

    expect(result.hydrateError).toBeUndefined();
    expect(result.diffIgnoringIds.map((entry) => entry.kind)).toContain(
      "extra",
    );
    expect(result.identity.pct).toBe(100);
  });

  it("removes the tips for a returning user at hydration, when it shows them first", () => {
    const result = results.showReturning;

    expect(result.hydrateError).toBeUndefined();
    expect(result.diffIgnoringIds.map((entry) => entry.kind)).toContain(
      "missing",
    );
    expect(result.identity.pct).toBeLessThan(100);
  });

  it("leaves the tips for a new user alone, when it shows them first", () => {
    expect(results.showNew.diffIgnoringIds).toEqual([]);
    expect(results.showNew.identity.pct).toBe(100);
  });

  it.each(["knownReturning", "knownNew"] as const)(
    "changes nothing after the server's HTML when the server knows the dismissals (%s)",
    (name) => {
      const result = results[name];

      expect(result.diffIgnoringIds).toEqual([]);
      expect(result.settledDiff).toEqual([]);
      expect(result.identity.pct).toBe(100);
      expect(result.brokenRefs.settled).toEqual([]);
    },
  );
});
