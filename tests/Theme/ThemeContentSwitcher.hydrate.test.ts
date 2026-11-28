// @vitest-environment node
// @depends-on tests/Theme/ThemeContentSwitcher.hydrate.test.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("./ThemeContentSwitcher.hydrate.test.svelte", import.meta.url),
);
let result: HydrateResult;

beforeAll(async () => {
  [result] = await hydrateFixtures([{ fixture }]);
}, 120_000);

it("keeps the server nodes and the selected theme", () => {
  expect(result.identity.pct).toBe(100);
  expect(result.diffIgnoringIds).toEqual([]);
  expect(result.settledDiff).toEqual([]);
  expect(result.brokenRefs.settled).toEqual([]);
});
