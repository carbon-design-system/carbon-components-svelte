// @vitest-environment node
import type { GanttBar } from "../../src/Gantt/gantt-utils.js";
import {
  alignDomain,
  anchorBar,
  applyDelta,
  buildAxis,
  computeSchedule,
  fromDay,
  hitMode,
  isConflict,
  isoWeekday,
  linkPath,
  localeWeek,
  patchNode,
  placeBar,
  toDay,
  weekendGradient,
} from "../../src/Gantt/gantt-utils.js";

const day = (iso: string) => toDay(iso) as number;

describe("toDay and fromDay", () => {
  it("reads a Date by its local date, whatever the time zone", () => {
    expect(toDay(new Date(2026, 2, 3, 23, 59))).toBe(day("2026-03-03"));
    expect(toDay(new Date(2026, 2, 3, 0, 0))).toBe(day("2026-03-03"));
  });

  it("rejects a date that rolls over", () => {
    expect(toDay("2026-02-30")).toBeNull();
    expect(toDay("soon")).toBeNull();
    expect(toDay(undefined)).toBeNull();
  });

  it("writes back the kind it was given", () => {
    const value = day("2026-03-03");
    expect(fromDay(value, "2026-01-01")).toBe("2026-03-03");
    const date = fromDay(value, new Date()) as Date;
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([
      2026, 2, 3,
    ]);
  });

  it("counts weekdays from Monday", () => {
    expect(isoWeekday(day("2026-03-02"))).toBe(1);
    expect(isoWeekday(day("2026-03-08"))).toBe(7);
  });
});

describe("computeSchedule", () => {
  const tasks = [
    {
      id: "phase",
      nodes: [
        { id: "a", start: "2026-03-02", end: "2026-03-06", progress: 100 },
        { id: "b", start: "2026-03-09", end: "2026-03-13", progress: 0 },
        { id: "m", start: "2026-03-16", milestone: true, progress: 50 },
        { id: "later" },
      ],
    },
  ];

  it("spans a summary over its children and weights progress by length", () => {
    const entry = computeSchedule(tasks).get("phase");
    expect(entry).toMatchObject({
      start: day("2026-03-02"),
      end: day("2026-03-16"),
      summary: true,
      progress: 50,
    });
  });

  it("gives a milestone one day, and a task without dates no bar", () => {
    const schedule = computeSchedule(tasks);
    expect(schedule.get("m")).toMatchObject({
      start: day("2026-03-16"),
      end: day("2026-03-16"),
      milestone: true,
    });
    expect(schedule.get("later")?.start).toBeNull();
  });

  it("ends a task on its start when the end is missing or earlier", () => {
    const schedule = computeSchedule([
      { id: "x", start: "2026-03-05" },
      { id: "y", start: "2026-03-05", end: "2026-03-01" },
    ]);
    expect(schedule.get("x")?.end).toBe(day("2026-03-05"));
    expect(schedule.get("y")?.end).toBe(day("2026-03-05"));
  });
});

describe("applyDelta", () => {
  it("moves both ends, or resizes one and never below a day", () => {
    expect(applyDelta(10, 14, "move", 3)).toEqual({ start: 13, end: 17 });
    expect(applyDelta(10, 14, "end", -9)).toEqual({ start: 10, end: 10 });
    expect(applyDelta(10, 14, "start", 9)).toEqual({ start: 14, end: 14 });
  });
});

describe("hitMode", () => {
  it("grabs an edge in the outer 8px and the body elsewhere", () => {
    expect(hitMode(2, 200)).toBe("start");
    expect(hitMode(198, 200)).toBe("end");
    expect(hitMode(100, 200)).toBe("move");
  });

  it("leaves the middle of a narrow bar to a move", () => {
    expect(hitMode(9, 18)).toBe("move");
  });
});

describe("placeBar and linkPath", () => {
  const entry = (start: string, end: string) => ({
    start: day(start),
    end: day(end),
    milestone: false,
    summary: false,
    progress: 0,
  });
  const origin = day("2026-03-02");

  it("places a bar from the day width and the row height", () => {
    const bar = placeBar(
      2,
      "a",
      entry("2026-03-04", "2026-03-05"),
      origin,
      40,
      32,
      true,
    );
    expect(bar).toMatchObject({ x: 80, width: 80, row: 2, y: 2 * 32 + 7 });
  });

  it("centres a milestone on its day", () => {
    const bar = placeBar(
      0,
      "m",
      { ...entry("2026-03-04", "2026-03-04"), milestone: true },
      origin,
      40,
      32,
      true,
    );
    expect((bar?.x ?? 0) + (bar?.width ?? 0) / 2).toBe(2 * 40 + 20);
  });

  it("routes a link beside the predecessor when the successor is clear", () => {
    const from = placeBar(
      0,
      "a",
      entry("2026-03-02", "2026-03-03"),
      origin,
      40,
      32,
      true,
    );
    const to = placeBar(
      1,
      "b",
      entry("2026-03-06", "2026-03-07"),
      origin,
      40,
      32,
      true,
    );
    const path = linkPath(from as GanttBar, to as GanttBar, 32);
    expect(path.startsWith("M80 16H88V48H160")).toBe(true);
  });

  it("threads the gap between rows when the successor starts before the end", () => {
    const from = placeBar(
      0,
      "a",
      entry("2026-03-02", "2026-03-06"),
      origin,
      40,
      32,
      true,
    );
    const to = placeBar(
      1,
      "b",
      entry("2026-03-03", "2026-03-04"),
      origin,
      40,
      32,
      true,
    );
    // Out 8px, down to the row boundary, back past the start, down, in.
    expect(
      linkPath(from as GanttBar, to as GanttBar, 32).startsWith(
        "M200 16H208V32H32V48H40",
      ),
    ).toBe(true);
  });

  it("flags a successor that starts on or before its predecessor's last day", () => {
    const a = entry("2026-03-02", "2026-03-06");
    expect(isConflict(a, entry("2026-03-06", "2026-03-08"))).toBe(true);
    expect(isConflict(a, entry("2026-03-07", "2026-03-08"))).toBe(false);
  });

  it("attaches a link to the nearest visible ancestor", () => {
    const phase = placeBar(
      0,
      "phase",
      entry("2026-03-02", "2026-03-06"),
      origin,
      40,
      32,
      false,
    );
    const byKey = new Map([["phase", phase as GanttBar]]);
    const parents = new Map<string | number, string | number | symbol>([
      ["child", "phase"],
      ["phase", Symbol("root")],
    ]);
    expect(anchorBar("child", byKey, parents)).toBe(phase);
    expect(anchorBar("missing", byKey, parents)).toBeUndefined();
  });
});

describe("axis", () => {
  it("snaps the domain to whole weeks of the locale", () => {
    const { firstDay } = localeWeek("en-US");
    const { start, end } = alignDomain(
      "week",
      day("2026-03-04"),
      day("2026-03-10"),
      firstDay,
    );
    expect(isoWeekday(start)).toBe(firstDay);
    expect((end - start) % 7).toBe(0);
  });

  it("labels months and days with Intl and sizes cells by the day width", () => {
    const axis = buildAxis({
      zoom: "day",
      start: day("2026-02-27"),
      end: day("2026-03-03"),
      locale: "en",
      firstDay: 1,
      formatQuarter: (quarter) => `Q${quarter}`,
    });
    expect(axis.top.map((cell) => [cell.label, cell.width])).toEqual([
      ["February 2026", 2 * 40],
      ["March 2026", 2 * 40],
    ]);
    expect(axis.bottom.map((cell) => cell.label)).toEqual([
      "27",
      "28",
      "1",
      "2",
    ]);
  });

  it("labels a quarter with the formatter, since Intl has none", () => {
    const axis = buildAxis({
      zoom: "quarter",
      start: day("2026-01-01"),
      end: day("2026-07-01"),
      locale: "en",
      firstDay: 1,
      formatQuarter: (quarter, year) => `T${quarter} ${year}`,
    });
    expect(axis.bottom.map((cell) => cell.label)).toEqual([
      "T1 2026",
      "T2 2026",
    ]);
  });

  it("stripes the weekend from the weekday the axis starts on", () => {
    // Axis starts on a Monday: Saturday and Sunday are offsets 5 and 6.
    const stripes = weekendGradient(day("2026-03-02"), 10, [6, 7], "red");
    expect(stripes).toContain("red 50px 70px");
    expect(weekendGradient(day("2026-03-02"), 2, [6, 7], "red")).toBe("");
  });
});

describe("patchNode", () => {
  it("copies only the path to the patched node", () => {
    const sibling = { id: "s" };
    const leaf = { id: "leaf", start: "x" };
    const tree = [{ id: "root", nodes: [leaf, sibling] }, { id: "other" }];
    const next = patchNode(tree, "leaf", { start: "y" });
    expect(next[0].nodes?.[0]).toEqual({ id: "leaf", start: "y" });
    expect(next[0].nodes?.[1]).toBe(sibling);
    expect(next[1]).toBe(tree[1]);
    expect(leaf.start).toBe("x");
  });
});
