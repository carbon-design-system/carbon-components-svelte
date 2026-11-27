// @vitest-environment node
// @depends-on src/Timeline/Timeline.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("../../src/Timeline/Timeline.svelte", import.meta.url),
);

let result: HydrateResult;
let unpinned: HydrateResult;

const items = [
  {
    id: "a",
    time: "2026-11-06T14:20:00Z",
    titleText: "Deployed",
    status: "success",
  },
  {
    id: "b",
    time: "2026-11-05T09:00:00Z",
    titleText: "Failed",
    status: "error",
  },
  { id: "c", time: "2026-11-04T09:00:00Z", titleText: "Started" },
  { id: "d", titleText: "Next", status: "pending" },
];

beforeAll(async () => {
  [result, unpinned] = await hydrateFixtures([
    {
      fixture,
      props: {
        "aria-label": "Deploys",
        groupBy: "day",
        order: "desc",
        limit: 2,
        now: Date.parse("2026-11-06T15:00:00Z"),
        locale: "en-US",
        timeZone: "UTC",
        items: [
          {
            id: "a",
            time: "2026-11-06T14:20:00Z",
            titleText: "Deployed",
            status: "success",
          },
          {
            id: "b",
            time: "2026-11-05T09:00:00Z",
            titleText: "Failed",
            status: "error",
          },
          { id: "c", time: "2026-11-04T09:00:00Z", titleText: "Started" },
          { id: "d", titleText: "Next", status: "pending" },
        ],
      },
    },
    // No clock, locale or zone: the server prints "en" and UTC with dates for
    // headings, and the browser's values take over after mount.
    { fixture, props: { "aria-label": "Deploys", groupBy: "day", items } },
  ]);
}, 120_000);

// With a fixed clock the server writes the headings, times and statuses
// and the show-earlier button, so the client takes them over unchanged.
it("keeps the server's markup and adds nothing after mount", () => {
  expect(result.serverHtml).toContain("Show 2 earlier events");
  expect(result.hydrateError).toBeUndefined();
  expect(result.identity.pct).toBe(100);
  expect(result.diffIgnoringIds).toEqual([]);
  expect(result.settledDiff).toEqual([]);
  expect(result.brokenRefs.settled).toEqual([]);
});

it("hydrates the unpinned markup unchanged, then reads the browser's clock", () => {
  expect(unpinned.hydrateError).toBeUndefined();
  expect(unpinned.identity.pct).toBe(100);
  // Only the text of the headings and times changes: no node is replaced.
  expect(unpinned.diffIgnoringIds.every(({ kind }) => kind === "text")).toBe(
    true,
  );
  expect(unpinned.brokenRefs.settled).toEqual([]);
  expect(unpinned.serverHtml).not.toContain(" ago");
});
