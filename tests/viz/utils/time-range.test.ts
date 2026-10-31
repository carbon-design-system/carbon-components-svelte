import { get } from "svelte/store";
import {
  createTimeRange,
  presetLabel,
  presetLength,
  timeRangeFromParam,
  timeRangeToParam,
} from "../../../src/viz/utils/time-range.js";

const NOW = Date.UTC(2026, 9, 24, 9, 41);

describe("createTimeRange", () => {
  test("counts a preset back from now, takes two dates in either order, and shifts by its length", () => {
    const range = createTimeRange({ presets: ["24h", "7d"], now: () => NOW });
    expect(get(range)).toEqual({
      from: new Date(NOW - 86_400_000),
      to: new Date(NOW),
      preset: "24h",
    });

    range.set([new Date(NOW), new Date(NOW - 3_600_000)]);
    expect(get(range)).toMatchObject({
      from: new Date(NOW - 3_600_000),
      preset: null,
    });

    range.shift(-1);
    expect(get(range).to).toEqual(new Date(NOW - 3_600_000));
    expect(() => range.set("yesterday")).toThrow(/preset/);
  });

  test("writes a preset or two dates for a URL and reads them back", () => {
    expect(presetLength("7d")).toBe(7 * 86_400_000);
    expect(presetLabel("7d", "en")).toBe("Last 7 days");
    const dates = {
      from: new Date(NOW - 1000),
      to: new Date(NOW),
      preset: null,
    };
    expect(timeRangeFromParam(timeRangeToParam(dates))).toEqual([
      dates.from,
      dates.to,
    ]);
    expect(timeRangeFromParam("30d")).toBe("30d");
    expect(timeRangeFromParam("junk")).toBeUndefined();
  });
});
