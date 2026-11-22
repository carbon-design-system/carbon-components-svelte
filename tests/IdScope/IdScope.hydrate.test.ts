// @vitest-environment node
// @depends-on tests/IdScope/Hydrate.test.svelte
// @depends-on tests/IdScope/Families.test.svelte
// @depends-on tests/IdScope/families.ts
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";
import { FAMILIES } from "./families";

const fixture = fileURLToPath(
  new URL("./Hydrate.test.svelte", import.meta.url),
);
const families = fileURLToPath(
  new URL("./Families.test.svelte", import.meta.url),
);

let scoped: HydrateResult;
let random: HydrateResult;
let byFamily: HydrateResult[];

beforeAll(async () => {
  [scoped, random, ...byFamily] = await hydrateFixtures([
    { fixture, props: { scoped: true } },
    { fixture, props: { scoped: false } },
    ...FAMILIES.map((family) => ({ fixture: families, props: { family } })),
  ]);
}, 120_000);

// The SSR sweep renders twice on the server, which a counter always passes.
// This catches a browser that draws ids in a different order.
describe("hydrating a compound component with an id on the root", () => {
  it.each(FAMILIES.map((family, index) => ({ family, index })))(
    "$family keeps every server id",
    ({ index }) => {
      const result = byFamily[index];
      assert(result);
      expect(result.serverRenderError).toBeUndefined();
      expect(result.hydrateError).toBeUndefined();
      expect(result.idChanges).toBe(0);
      expect(result.brokenRefs.settled).toEqual([]);
    },
  );
});

describe("hydrating components with no id", () => {
  it("keeps every server id inside a root scope", () => {
    expect(scoped.serverRenderError).toBeUndefined();
    expect(scoped.hydrateError).toBeUndefined();
    expect(scoped.warnings).toEqual([]);
    expect(scoped.errors).toEqual([]);
    expect(scoped.idChanges).toBe(0);
    expect(scoped.diff).toEqual([]);
    expect(scoped.brokenRefs.settled).toEqual([]);
    expect(scoped.ok).toBe(true);
  });

  it("rewrites random ids without a scope, and keeps them paired", () => {
    expect(random.idChanges).toBeGreaterThan(0);
    expect(random.diffIgnoringIds).toEqual([]);
    expect(random.brokenRefs.settled).toEqual([]);
  });
});
