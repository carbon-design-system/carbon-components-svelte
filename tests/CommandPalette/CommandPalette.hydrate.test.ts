// @vitest-environment node
// @depends-on tests/CommandPalette/CommandPalette.hydrate.test.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("./CommandPalette.hydrate.test.svelte", import.meta.url),
);

let results: HydrateResult[];

// The palette is a modal dialog, so the shared announcer makes its live
// region inside it as the palette mounts, before any message: a screen
// reader reports changes only in a region it has seen. That region is the
// one addition hydration may make.
const ANNOUNCER_REGION = expect.objectContaining({
  kind: "extra",
  after: expect.stringContaining("data-announcer"),
});
const withoutAnnouncer = (diff: HydrateResult["diffIgnoringIds"]) =>
  diff.filter((change) => !String(change.after).includes("data-announcer"));

beforeAll(async () => {
  results = await hydrateFixtures([
    { fixture, props: { open: true } },
    { fixture, props: { open: true, value: "deploy" } },
    { fixture, props: { open: false } },
  ]);
}, 120_000);

it("adds only the announcer's region as it mounts", () => {
  expect(results[0].diffIgnoringIds).toEqual([ANNOUNCER_REGION]);
  expect(results[2].diffIgnoringIds).toEqual([ANNOUNCER_REGION]);
});

it.each([
  ["open", 0],
  ["closed", 2],
])("keeps the server nodes and paints the final state (%s)", (_, index) => {
  const result = results[index];

  expect(result.hydrateError).toBeUndefined();
  expect(result.identity.pct).toBe(100);
  expect(withoutAnnouncer(result.diffIgnoringIds)).toEqual([]);
  expect(result.settledDiff).toEqual([]);
  expect(result.brokenRefs.settled).toEqual([]);
});

it("keeps the filtered rows the server sent for a query", () => {
  const result = results[1];

  expect(result.serverHtml).toContain('id="palette-option-0"');
  expect(result.serverHtml).not.toContain('id="palette-option-1"');
  expect(result.identity.pct).toBe(100);
  // Svelte 5 moves a bound input's value from the attribute to the
  // property as it hydrates, so a form reset does not restore the server
  // value. The field still shows the query.
  expect(result.diffIgnoringIds).toEqual([
    expect.objectContaining({
      kind: "attr-removed",
      before: "value=deploy",
      path: expect.stringContaining("input#palette"),
    }),
    ANNOUNCER_REGION,
  ]);
  expect(result.settledDiff).toEqual([]);
  expect(result.brokenRefs.settled).toEqual([]);
});
