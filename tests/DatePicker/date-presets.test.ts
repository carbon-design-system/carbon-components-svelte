// @vitest-environment node
import { datePresets } from "../../src/DatePicker/date-presets.js";

// A Wednesday.
const today = new Date(2026, 9, 28, 15, 30);
const context = { today, firstDayOfWeek: 0, time: false };

describe("datePresets", () => {
  it.each([
    [
      "lastDays(7) counts today as one of the seven",
      datePresets.lastDays(7)(context),
      [new Date(2026, 9, 22), new Date(2026, 9, 28)],
    ],
    [
      "thisWeek starts on firstDayOfWeek",
      datePresets.thisWeek({ ...context, firstDayOfWeek: 1 }),
      [new Date(2026, 9, 26), new Date(2026, 10, 1)],
    ],
    [
      "lastMonth crosses the year",
      datePresets.lastMonth({ ...context, today: new Date(2026, 0, 15) }),
      [new Date(2025, 11, 1), new Date(2025, 11, 31)],
    ],
    [
      "a span with a time ends at its last second",
      datePresets.today({ ...context, time: true }),
      [new Date(2026, 9, 28), new Date(2026, 9, 28, 23, 59, 59)],
    ],
  ])("%s", (_, actual, expected) => {
    expect(actual).toEqual(expected);
  });
});
