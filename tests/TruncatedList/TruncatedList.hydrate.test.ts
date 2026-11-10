// @vitest-environment node
// @depends-on src/TruncatedList/TruncatedList.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const list = fileURLToPath(
  new URL("../../src/TruncatedList/TruncatedList.svelte", import.meta.url),
);
const items = [
  "Ada Lovelace",
  "Grace Hopper",
  "Alan Turing",
  "Edsger Dijkstra",
];

let results: HydrateResult[];

beforeAll(async () => {
  results = await hydrateFixtures([
    { fixture: list, props: { items, max: 2 } },
    { fixture: list, props: { items, max: 2, fit: "width" } },
    {
      fixture: list,
      props: { items, max: 2, locale: "ar", overflow: "expand" },
    },
  ]);
}, 120_000);

// The server renders `max` items. Hydration keeps every node, so the list
// does not flash or shift before it fits to the line.
it.each([
  ["a count", 0],
  ["a width", 1],
  ["Arabic", 2],
])("hydrates %s without replacing a node", (_, index) => {
  const result = results[index];

  expect(result.hydrateError).toBeUndefined();
  expect(result.errors).toEqual([]);
  expect(result.identity.pct).toBe(100);
  expect(result.diffIgnoringIds).toEqual([]);
});
