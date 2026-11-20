// @vitest-environment node
// @depends-on tests/OnboardingChecklist/OnboardingChecklist.ssr.test.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("./OnboardingChecklist.ssr.test.svelte", import.meta.url),
);

// A returning user checked a task and minimized the floating checklist; a
// new user did nothing.
const returning = { done: ["invite"], minimized: true };

const scenarios = {
  hideReturning: { stored: returning },
  hideNew: { stored: {} },
  showReturning: { stored: returning, pending: "show" },
  showNew: { stored: {}, pending: "show" },
  knownReturning: { stored: returning, initial: returning },
  knownNew: { stored: {}, initial: {} },
} as const;

type Name = keyof typeof scenarios;

let results: Record<Name, HydrateResult>;

beforeAll(async () => {
  const names = Object.keys(scenarios) as Name[];
  const list = await hydrateFixtures(
    names.map((name) => ({
      fixture,
      props: { floating: true, ...scenarios[name] },
    })),
  );
  results = Object.fromEntries(
    names.map((name, i) => [name, list[i]]),
  ) as Record<Name, HydrateResult>;
}, 120_000);

// Svelte 5 sets a checkbox's state as a property and drops the server's
// `checked` attribute while hydrating. The box stays checked, which the
// identity check below sees, so the diff leaves the attribute out.
function changes(result: HydrateResult) {
  return result.diffIgnoringIds.filter(
    (entry) => !(entry.kind === "attr-removed" && entry.before === "checked="),
  );
}

// `diff` compares the server's HTML with the DOM once `hydrate()` flushes,
// and the flush already runs `onMount`, which reads the storage. So the page
// a visitor sees changes there, between the server's HTML and the first
// interactive state, and `settledDiff` stays empty.
describe("OnboardingChecklist hydration", () => {
  it("adds the checklist at hydration for a user the server knows nothing about", () => {
    const result = results.hideNew;

    expect(result.hydrateError).toBeUndefined();
    expect(result.diffIgnoringIds.map((entry) => entry.kind)).toContain(
      "extra",
    );
    expect(result.identity.pct).toBe(100);
  });

  it("changes the checklist for a returning user at hydration, when it shows it first", () => {
    const result = results.showReturning;

    expect(result.hydrateError).toBeUndefined();
    expect(result.diffIgnoringIds).not.toEqual([]);
  });

  it("leaves a new user's checklist alone, when it shows it first", () => {
    expect(results.showNew.diffIgnoringIds).toEqual([]);
    expect(results.showNew.identity.pct).toBe(100);
  });

  it.each(["knownReturning", "knownNew"] as const)(
    "changes nothing after the server's HTML when the server knows the progress (%s)",
    (name) => {
      const result = results[name];

      expect(changes(result)).toEqual([]);
      expect(result.settledDiff).toEqual([]);
      expect(result.identity.pct).toBe(100);
      expect(result.brokenRefs.settled).toEqual([]);
    },
  );
});
