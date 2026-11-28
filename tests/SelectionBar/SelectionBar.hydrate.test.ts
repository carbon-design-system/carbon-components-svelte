// @vitest-environment node
// @depends-on tests/SelectionBar/SelectionBar.test.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("./SelectionBar.test.svelte", import.meta.url),
);
let result: HydrateResult;

beforeAll(async () => {
  [result] = await hydrateFixtures([{ fixture, props: { count: 2 } }]);
}, 120_000);

// A page that loads with a selection renders the bar on the server, with
// the count that names it and the tags in its scope.
describe("SelectionBar hydration", () => {
  it("keeps the server nodes and the count that names the bar", () => {
    expect(result.serverHtml).toContain("2 selected");
    expect(result.hydrateError).toBeUndefined();
    expect(result.identity.pct).toBe(100);
    expect(result.diffIgnoringIds).toEqual([]);
    expect(result.settledDiff).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([]);
  });
});
