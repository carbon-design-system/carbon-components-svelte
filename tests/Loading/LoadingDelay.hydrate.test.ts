// @vitest-environment node
// @depends-on src/Loading/Loading.svelte src/InlineLoading/InlineLoading.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const loading = fileURLToPath(
  new URL("../../src/Loading/Loading.svelte", import.meta.url),
);
const inlineLoading = fileURLToPath(
  new URL("../../src/InlineLoading/InlineLoading.svelte", import.meta.url),
);

let results: HydrateResult[];

beforeAll(async () => {
  results = await hydrateFixtures([
    { fixture: loading, props: { delay: 300 } },
    { fixture: loading, props: { delay: 300, withOverlay: false } },
    { fixture: inlineLoading, props: { delay: 300, description: "Saving" } },
  ]);
}, 120_000);

// The server renders a waiting spinner, so hydration must keep that node
// and leave it waiting: dropping it would flash the page.
it.each([
  ["Loading", 0, "bx--loading-overlay--delayed"],
  ["Loading without overlay", 1, "bx--loading--delayed"],
  ["InlineLoading", 2, "bx--inline-loading--delayed"],
])("%s keeps the waiting spinner the server sent", (_, index, delayedClass) => {
  const result = results[index];

  expect(result.serverHtml).toContain(delayedClass);
  expect(result.hydrateError).toBeUndefined();
  expect(result.identity.pct).toBe(100);
  expect(result.diffIgnoringIds).toEqual([]);
  expect(result.settledDiff).toEqual([]);
});
