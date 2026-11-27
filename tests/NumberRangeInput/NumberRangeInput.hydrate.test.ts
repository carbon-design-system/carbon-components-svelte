// @vitest-environment node
// @depends-on src/NumberRangeInput/NumberRangeInput.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL(
    "../../src/NumberRangeInput/NumberRangeInput.svelte",
    import.meta.url,
  ),
);
let results: HydrateResult[];

beforeAll(async () => {
  results = await hydrateFixtures([
    {
      fixture,
      props: {
        id: "price",
        labelText: "Price",
        helperText: "In dollars",
        min: 0,
        max: 1000,
        slider: true,
        value: [10, 250],
        minName: "price_min",
        maxName: "price_max",
      },
    },
    {
      fixture,
      props: { id: "open", labelText: "Price", value: [null, 250] },
    },
  ]);
}, 120_000);

// The server prints both fields at their values, the slider at its handles
// and the hidden inputs under their names. Hydration keeps those nodes, and
// every id the fields point at still resolves.
describe("NumberRangeInput hydration", () => {
  it.each([
    ["a range with a slider", 0],
    ["an open end", 1],
  ])("keeps the server nodes for %s", (_label, index) => {
    const result = results[index];
    expect(result.hydrateError).toBeUndefined();
    expect(result.identity.pct).toBe(100);
    expect(
      result.diffIgnoringIds.filter(
        ({ kind, before }) =>
          !(kind === "attr-removed" && (before ?? "").startsWith("value=")),
      ),
    ).toEqual([]);
    expect(result.formLoss).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([]);
  });

  it("prints each end under its own name", () => {
    expect(results[0].serverHtml).toContain('name="price_min"');
    expect(results[0].serverHtml).toContain('name="price_max"');
  });
});
