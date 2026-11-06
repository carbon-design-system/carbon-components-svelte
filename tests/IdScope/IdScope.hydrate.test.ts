// @vitest-environment node
// @depends-on tests/IdScope/Hydrate.test.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("./Hydrate.test.svelte", import.meta.url),
);

let scoped: HydrateResult;
let random: HydrateResult;

beforeAll(async () => {
  [scoped, random] = await hydrateFixtures([
    { fixture, props: { scoped: true } },
    { fixture, props: { scoped: false } },
  ]);
}, 120_000);

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
