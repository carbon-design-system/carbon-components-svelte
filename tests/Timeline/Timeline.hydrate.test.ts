// @vitest-environment node
// @depends-on src/Timeline/Timeline.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("../../src/Timeline/Timeline.svelte", import.meta.url),
);

let result: HydrateResult;

beforeAll(async () => {
  [result] = await hydrateFixtures([
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
            title: "Deployed",
            status: "success",
          },
          {
            id: "b",
            time: "2026-11-05T09:00:00Z",
            title: "Failed",
            status: "error",
          },
          { id: "c", time: "2026-11-04T09:00:00Z", title: "Started" },
          { id: "d", title: "Next", status: "pending" },
        ],
      },
    },
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
