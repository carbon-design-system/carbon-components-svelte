// @vitest-environment node
// @depends-on src/Coachmark/Coachmark.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("../../src/Coachmark/Coachmark.svelte", import.meta.url),
);
let result: HydrateResult;

beforeAll(async () => {
  [result] = await hydrateFixtures([
    { fixture, props: { titleText: "Export in bulk", open: true } },
  ]);
}, 120_000);

// A first-visit coachmark can render open on the server. Hydration must
// keep its nodes, and the dialog must still be named by its heading.
describe("Coachmark hydration", () => {
  it("keeps the server nodes and the heading that names the dialog", () => {
    expect(result.serverHtml).toContain("Export in bulk");
    expect(result.hydrateError).toBeUndefined();
    expect(result.identity.pct).toBe(100);
    expect(result.diffIgnoringIds).toEqual([]);
    expect(result.settledDiff).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([]);
  });
});
