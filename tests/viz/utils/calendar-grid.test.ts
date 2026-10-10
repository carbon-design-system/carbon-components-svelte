import { buildCalendarGrid } from "../../../src/viz/utils/calendar-grid.js";

type Row = { day: Date | string; n: number };

const accessors = {
  date: (row: Row) => row.day,
  value: (row: Row) => row.n,
};

describe("buildCalendarGrid", () => {
  test("lays a year out as week columns that start on Sunday", () => {
    // 2026 starts on a Thursday.
    const grid = buildCalendarGrid([], { ...accessors, year: 2026 });

    expect(grid.year).toBe(2026);
    expect(grid.weeks).toHaveLength(53);
    expect(grid.weekdays).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(grid.weeks[0].days.map((day) => day?.iso ?? null)).toEqual([
      null,
      null,
      null,
      null,
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
    const days = grid.weeks.flatMap((week) => week.days).filter(Boolean);
    expect(days).toHaveLength(365);
    expect(days.at(-1)?.iso).toBe("2026-12-31");
  });

  test("honors the first day of the week", () => {
    const grid = buildCalendarGrid([], {
      ...accessors,
      year: 2026,
      weekStart: 1,
    });

    expect(grid.weekdays).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(grid.weeks[0].days.findIndex((day) => day !== null)).toBe(3);
  });

  test("has 366 days in a leap year and never skips one", () => {
    const grid = buildCalendarGrid([], { ...accessors, year: 2028 });
    const isos = grid.weeks
      .flatMap((week) => week.days)
      .filter((day) => day !== null)
      .map((day) => day?.iso);

    expect(isos).toHaveLength(366);
    expect(new Set(isos).size).toBe(366);
    expect(isos).toContain("2028-02-29");
  });

  test("sums the rows of a day and leaves other days null", () => {
    const rows: Row[] = [
      { day: new Date(2026, 0, 5, 9), n: 2 },
      { day: new Date(2026, 0, 5, 17), n: 3 },
      { day: "2026-03-10T12:00:00", n: 7 },
      { day: new Date(2025, 5, 1), n: 99 },
      { day: "not a date", n: 1 },
      { day: new Date(2026, 1, 1), n: Number.NaN },
    ];
    const grid = buildCalendarGrid(rows, { ...accessors, year: 2026 });
    const find = (iso: string) =>
      grid.weeks.flatMap((week) => week.days).find((day) => day?.iso === iso);

    expect(find("2026-01-05")).toMatchObject({ value: 5, weekday: 1 });
    expect(find("2026-01-05")?.data).toHaveLength(2);
    expect(find("2026-03-10")?.value).toBe(7);
    expect(find("2026-01-06")?.value).toBeNull();
    expect(find("2026-02-01")?.value).toBeNull();
    // The 2025 row is outside the year, so it does not stretch the extent.
    expect([grid.min, grid.max]).toEqual([5, 7]);
  });

  test("defaults to the year of the latest date", () => {
    const grid = buildCalendarGrid(
      [
        { day: new Date(2024, 11, 31), n: 1 },
        { day: new Date(2025, 0, 2), n: 1 },
      ],
      accessors,
    );

    expect(grid.year).toBe(2025);
  });

  test("labels each month over the weeks until the next one", () => {
    const grid = buildCalendarGrid([], { ...accessors, year: 2026 });

    expect(grid.months.map((entry) => entry.month)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
    expect(grid.months[0]).toEqual({ month: 0, week: 0, span: 5 });
    expect(grid.months.reduce((sum, entry) => sum + entry.span, 0)).toBe(53);
  });
});
