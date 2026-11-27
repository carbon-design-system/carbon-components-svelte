// @vitest-environment node
// @depends-on src/ImageCompare/ImageCompare.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("../../src/ImageCompare/ImageCompare.svelte", import.meta.url),
);
let result: HydrateResult;

beforeAll(async () => {
  [result] = await hydrateFixtures([
    {
      fixture,
      props: {
        beforeSrc: "before.png",
        afterSrc: "after.png",
        value: 35,
        labelText: "Denoised photo",
      },
    },
  ]);
}, 120_000);

// The server prints the divider at its value, so the frame does not move
// when the script runs. Hydration must keep those nodes.
describe("ImageCompare hydration", () => {
  it("keeps the server nodes and the divider's position and text", () => {
    expect(result.serverHtml).toContain('aria-valuenow="35"');
    expect(result.hydrateError).toBeUndefined();
    expect(result.identity.pct).toBe(100);
    expect(result.diffIgnoringIds).toEqual([]);
    expect(result.settledDiff).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([]);
  });
});
