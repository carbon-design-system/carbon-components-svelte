// @vitest-environment node
// @depends-on tests/DataGrid/DataGrid.hydrate.test.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("./DataGrid.hydrate.test.svelte", import.meta.url),
);
let result: HydrateResult;

beforeAll(async () => {
  [result] = await hydrateFixtures([{ fixture }]);
}, 120_000);

describe("DataGrid hydration", () => {
  it("keeps the server nodes", () => {
    expect(result.serverRenderError).toBeUndefined();
    expect(result.hydrateError).toBeUndefined();
    expect(result.identity.pct).toBe(100);
    expect(result.diffIgnoringIds).toEqual([]);
  });

  it("paints the final window on the server, so nothing moves after mount", () => {
    expect(result.settledDiff).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([]);
  });
});
