// @vitest-environment node
// @depends-on tests/InfiniteList/InfiniteList.ssr.test.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("./InfiniteList.ssr.test.svelte", import.meta.url),
);

let results: HydrateResult[];

beforeAll(async () => {
  results = await hydrateFixtures([
    { fixture },
    { fixture, props: { restore: true, scroll: "container" } },
  ]);
}, 120_000);

// The server sends the first page, and the client hydrates that same page:
// nothing is rebuilt, no page loads, and the pieces the list adds after
// mount (the observer, the saved place) draw nothing.
it.each([
  ["a list", 0],
  ["a list that restores and scrolls itself", 1],
])("keeps the first page the server sent in %s", (_, index) => {
  const result = results[index];

  expect(result.serverHtml).toContain("Row 3");
  expect(result.hydrateError).toBeUndefined();
  expect(result.identity.pct).toBe(100);
  expect(result.diffIgnoringIds).toEqual([]);
  expect(result.settledDiff).toEqual([]);
  expect(result.brokenRefs.settled).toEqual([]);
});
