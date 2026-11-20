// @vitest-environment node
// @depends-on tests/SettingsPage/SettingsPage.test.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("./SettingsPage.test.svelte", import.meta.url),
);
let result: HydrateResult;

beforeAll(async () => {
  [result] = await hydrateFixtures([{ fixture }]);
}, 120_000);

// What the client rewrites on a bound input and an inert bar: `value` and
// `checked` become properties, and `inert` is written as `"true"`. None
// changes how the page looks.
function summary(diff: HydrateResult["diffIgnoringIds"]) {
  return diff.map(({ kind, after }) => `${kind} ${after}`);
}

const SPELLING = [
  "attr-removed value=null",
  "attr-removed checked=null",
  "attr inert=true",
];

describe("SettingsPage hydration", () => {
  it("keeps the server's nodes", () => {
    expect(result.serverRenderError).toBeUndefined();
    expect(result.hydrateError).toBeUndefined();
    expect(result.identity.pct).toBe(100);
    expect(summary(result.diffIgnoringIds)).toEqual(SPELLING);
  });

  it("paints the section list, every row and the save bar's place at first", () => {
    // jsdom has no layout, so the scroll spy picks the last section once it
    // runs and moves the list's mark and the menu's text. A browser at the top
    // of the page keeps the first section the server marked.
    const rest = result.settledDiff.filter(
      ({ path }) => !path.includes("/nav[0]/ul") && !path.includes("-jump"),
    );
    expect(summary(rest)).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([]);
  });
});
