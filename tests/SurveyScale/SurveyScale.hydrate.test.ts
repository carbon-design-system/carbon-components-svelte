// @vitest-environment node
// @depends-on tests/SurveyScale/SurveyScale.hydrate.test.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("./SurveyScale.hydrate.test.svelte", import.meta.url),
);
let result: HydrateResult;

beforeAll(async () => {
  [result] = await hydrateFixtures([{ fixture }]);
}, 120_000);

it("keeps the server nodes, the ids and the checked option", () => {
  expect(result.identity.pct).toBe(100);
  // Svelte 5 moves a hydrated input's `checked` attribute to the property;
  // `formLoss` shows the option is still checked.
  expect(result.diffIgnoringIds).toEqual([
    expect.objectContaining({ kind: "attr-removed", before: "checked=" }),
  ]);
  expect(result.formLoss).toEqual([]);
  expect(result.settledDiff).toEqual([]);
  expect(result.brokenRefs.settled).toEqual([]);
});
