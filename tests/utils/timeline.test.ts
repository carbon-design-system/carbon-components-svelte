import {
  buildTimeline,
  dayNumber,
  defaultGroupLabel,
  defaultStatusText,
  isWithinRelative,
} from "../../src/utils/timeline.js";

const at = (iso: string) => Date.parse(iso);
const now = at("2026-11-06T15:00:00Z");

const ids = (result: ReturnType<typeof buildTimeline>) =>
  result.groups.flatMap((group) => group.rows.map((row) => row.key));

describe("dayNumber", () => {
  it("counts calendar days in the given zone", () => {
    const late = at("2026-11-06T23:30:00Z");
    expect(dayNumber(late, "UTC")).toBe(
      dayNumber(at("2026-11-06T00:00:00Z"), "UTC"),
    );
    // 23:30 UTC is already the next day in Tokyo.
    expect(dayNumber(late, "Asia/Tokyo") - dayNumber(late, "UTC")).toBe(1);
  });

  it("steps one day across a daylight saving change", () => {
    // 23 hours apart, on consecutive days: the clocks went forward between.
    const before = at("2026-03-08T05:30:00Z");
    const after = at("2026-03-09T04:30:00Z");
    expect(
      dayNumber(after, "America/New_York") -
        dayNumber(before, "America/New_York"),
    ).toBe(1);
  });
});

describe("defaultGroupLabel", () => {
  const context = { now, locale: "en-US", timeZone: "UTC" };

  it("names today, yesterday and tomorrow", () => {
    expect(defaultGroupLabel(at("2026-11-06T01:00:00Z"), context)).toBe(
      "Today",
    );
    expect(defaultGroupLabel(at("2026-11-05T23:59:00Z"), context)).toBe(
      "Yesterday",
    );
    expect(defaultGroupLabel(at("2026-11-07T08:00:00Z"), context)).toBe(
      "Tomorrow",
    );
  });

  it("writes a short date, with the year only when it is not this one", () => {
    expect(defaultGroupLabel(at("2026-10-07T10:00:00Z"), context)).toBe(
      "Oct 7",
    );
    expect(defaultGroupLabel(at("2025-10-02T10:00:00Z"), context)).toBe(
      "Oct 2, 2025",
    );
  });

  it("reads the day in the locale", () => {
    expect(
      defaultGroupLabel(at("2026-11-05T10:00:00Z"), {
        ...context,
        locale: "de",
      }),
    ).toBe("Gestern");
  });
});

describe("buildTimeline", () => {
  const items = [
    { id: "b", time: at("2026-11-05T10:00:00Z") },
    { id: "c", time: at("2026-11-06T09:00:00Z") },
    { id: "a", time: at("2026-11-04T10:00:00Z") },
  ];

  it("sorts oldest first by default and newest first on request", () => {
    expect(ids(buildTimeline(items))).toEqual(["a", "b", "c"]);
    expect(ids(buildTimeline(items, { order: "desc" }))).toEqual([
      "c",
      "b",
      "a",
    ]);
  });

  it("keeps the source order of equal times in both directions", () => {
    const tied = [
      { id: "x", time: 1 },
      { id: "y", time: 1 },
      { id: "z", time: 0 },
    ];
    expect(ids(buildTimeline(tied))).toEqual(["z", "x", "y"]);
    expect(ids(buildTimeline(tied, { order: "desc" }))).toEqual([
      "x",
      "y",
      "z",
    ]);
  });

  it("treats an event with no time as the latest", () => {
    const pending = [{ id: "next" }, ...items];
    expect(ids(buildTimeline(pending))).toEqual(["a", "b", "c", "next"]);
    expect(ids(buildTimeline(pending, { order: "desc" }))).toEqual([
      "next",
      "c",
      "b",
      "a",
    ]);
  });

  it("accepts dates, strings and numbers, and keys a row without an id by position", () => {
    const mixed = [
      { time: "2026-11-06T10:00:00Z" },
      { time: new Date("2026-11-05T10:00:00Z") },
    ];
    const rows = buildTimeline(mixed).groups[0].rows;
    expect(rows.map((row) => [row.key, row.index])).toEqual([
      ["#1", 1],
      ["#0", 0],
    ]);
  });

  it("keeps the latest events under a limit and counts the rest", () => {
    const asc = buildTimeline(items, { limit: 2 });
    expect(ids(asc)).toEqual(["b", "c"]);
    expect(asc).toMatchObject({ hidden: 1, earlier: 1, total: 3 });

    const desc = buildTimeline(items, { limit: 2, order: "desc" });
    expect(ids(desc)).toEqual(["c", "b"]);
    expect(desc.hidden).toBe(1);
  });

  it("shows every event once expanded, and still reports what was cut", () => {
    const result = buildTimeline(items, { limit: 1, expanded: true });
    expect(ids(result)).toEqual(["a", "b", "c"]);
    expect(result).toMatchObject({ hidden: 0, earlier: 2 });
  });

  it("does not collapse a list at or under the limit", () => {
    expect(buildTimeline(items, { limit: 3 })).toMatchObject({
      hidden: 0,
      earlier: 0,
    });
    expect(buildTimeline(items, { limit: Number.NaN })).toMatchObject({
      earlier: 0,
    });
  });

  it("starts a group each day, in the zone's days", () => {
    const result = buildTimeline(
      [
        { id: "late", time: at("2026-11-05T23:30:00Z") },
        { id: "early", time: at("2026-11-06T00:30:00Z") },
        { id: "noon", time: at("2026-11-06T12:00:00Z") },
      ],
      { groupBy: "day", now, locale: "en-US", timeZone: "UTC" },
    );
    expect(
      result.groups.map((group) => [group.label, group.rows.length]),
    ).toEqual([
      ["Yesterday", 1],
      ["Today", 2],
    ]);

    // The same instants fall on one day in New York.
    const newYork = buildTimeline(
      [
        { id: "late", time: at("2026-11-05T23:30:00Z") },
        { id: "early", time: at("2026-11-06T00:30:00Z") },
      ],
      { groupBy: "day", now, locale: "en-US", timeZone: "America/New_York" },
    );
    expect(newYork.groups).toHaveLength(1);
  });

  it("puts an event with no time in the group before it, never its own", () => {
    const asc = buildTimeline([...items, { id: "next" }], {
      groupBy: "day",
      now,
      locale: "en-US",
      timeZone: "UTC",
    });
    expect(asc.groups.map((group) => group.label)).toEqual([
      "Nov 4",
      "Yesterday",
      "Today",
    ]);
    expect(asc.groups[2].rows.map((row) => row.key)).toEqual(["c", "next"]);

    const desc = buildTimeline([...items, { id: "next" }], {
      groupBy: "day",
      order: "desc",
      now,
      locale: "en-US",
      timeZone: "UTC",
    });
    // Leading, headed by nothing, so the in-progress step is not under "Today".
    expect(desc.groups[0]).toMatchObject({ label: null });
    expect(desc.groups[0].rows.map((row) => row.key)).toEqual(["next"]);
    expect(new Set(desc.groups.map((group) => group.key)).size).toBe(
      desc.groups.length,
    );
  });

  it("takes a custom heading", () => {
    const result = buildTimeline(items, {
      groupBy: "day",
      groupLabel: (time) => `day ${new Date(time).getUTCDate()}`,
    });
    expect(result.groups.map((group) => group.label)).toEqual([
      "day 4",
      "day 5",
      "day 6",
    ]);
  });
});

describe("defaultStatusText and isWithinRelative", () => {
  it("names a status and says nothing for none", () => {
    expect(defaultStatusText("error")).toBe("Error");
    expect(defaultStatusText("pending")).toBe("In progress");
    expect(defaultStatusText(undefined)).toBe("");
  });

  it("limits a relative time by age", () => {
    const hour = 3_600_000;
    expect(isWithinRelative(now - hour, now, 2 * hour)).toBe(true);
    expect(isWithinRelative(now - 3 * hour, now, 2 * hour)).toBe(false);
    expect(isWithinRelative(now + hour, now, 2 * hour)).toBe(true);
    expect(isWithinRelative(now - hour, now, 0)).toBe(false);
    expect(isWithinRelative(now - 1e12, now, Number.POSITIVE_INFINITY)).toBe(
      true,
    );
    expect(isWithinRelative(Number.NaN, now, Number.POSITIVE_INFINITY)).toBe(
      false,
    );
  });
});
