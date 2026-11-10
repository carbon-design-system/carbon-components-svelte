// @vitest-environment node
// @depends-on src/ErrorSummary/ErrorSummary.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("../../src/ErrorSummary/ErrorSummary.svelte", import.meta.url),
);
let result: HydrateResult;

beforeAll(async () => {
  [result] = await hydrateFixtures([
    {
      fixture,
      props: {
        errors: [
          { fieldId: "name", message: "Enter a name" },
          { fieldId: "plan", message: "Choose a plan" },
        ],
      },
    },
  ]);
}, 120_000);

// A form action's failure renders the summary on the server. Hydration
// must keep it, with its heading still naming the group.
describe("ErrorSummary hydration", () => {
  it("keeps the server nodes and the heading that names the group", () => {
    expect(result.serverHtml).toContain("There is a problem");
    expect(result.hydrateError).toBeUndefined();
    expect(result.identity.pct).toBe(100);
    expect(result.diffIgnoringIds).toEqual([]);
    expect(result.settledDiff).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([]);
  });
});
