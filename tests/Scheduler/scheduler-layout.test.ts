import {
  hiddenPerDay,
  layoutDay,
  moveRecord,
  packBars,
  readEvents,
  resizeRecord,
  snapMinute,
  splitByDay,
} from "../../src/Scheduler/scheduler-layout.js";
import { civilDay, getZone } from "../../src/Scheduler/scheduler-time.js";

const zone = getZone("America/Los_Angeles");
const MON = civilDay(2026, 9, 26);

/** A local-zone instant on `MON + offset` at `hour`:`minute`. */
function at(offset: number, hour: number, minute = 0) {
  return new Date(zone.instant(MON + offset, hour * 60 + minute));
}

function timed(id: string, start: Date, end: Date) {
  return { id, title: id, start, end };
}

function layoutOf(events: ReturnType<typeof timed>[]) {
  const [day] = splitByDay(readEvents(events, zone), MON, MON, 30);
  layoutDay(day);
  return Object.fromEntries(
    day.map((s) => [s.record.id, [s.column, s.columns, s.span]]),
  );
}

describe("readEvents", () => {
  it("skips an event without a valid start", () => {
    const records = readEvents(
      [
        { id: "a", title: "a", start: new Date("nope") },
        { id: "b", title: "b" },
        timed("c", at(0, 9), at(0, 10)),
      ],
      zone,
    );
    expect(records.map((r) => r.id)).toEqual(["c"]);
  });

  it("treats an all-day end as exclusive", () => {
    const [record] = readEvents(
      [{ id: "a", title: "a", start: at(0, 0), end: at(2, 0), allDay: true }],
      zone,
    );
    expect([record.startDay, record.lastDay]).toEqual([MON, MON + 1]);
    expect(record.banner).toBe(true);
  });

  it("ends a timed event at midnight on the day it started", () => {
    const [record] = readEvents([timed("a", at(0, 22), at(1, 0))], zone);
    expect(record.lastDay).toBe(MON);
    expect(record.endMinute).toBe(1440);
  });

  it("moves a timed event of 24 hours or more to the all-day row", () => {
    const [short, long] = readEvents(
      [timed("a", at(0, 9), at(1, 8)), timed("b", at(0, 9), at(1, 9))],
      zone,
    );
    expect(short.banner).toBe(false);
    expect(long.banner).toBe(true);
  });

  it("gives an event with no end no length", () => {
    const [record] = readEvents(
      [{ id: "a", title: "a", start: at(0, 9) }],
      zone,
    );
    expect(record.endMs).toBe(record.startMs);
  });
});

describe("splitByDay", () => {
  it("splits an overnight event at midnight", () => {
    const records = readEvents([timed("a", at(0, 22), at(1, 2))], zone);
    const days = splitByDay(records, MON, MON + 1, 30);
    expect(
      days[0].map((s) => [s.startMin, s.endMin, s.continuesAfter]),
    ).toEqual([[1320, 1440, true]]);
    expect(
      days[1].map((s) => [s.startMin, s.endMin, s.continuesBefore]),
    ).toEqual([[0, 120, true]]);
  });

  it("drops the days outside the range", () => {
    const records = readEvents([timed("a", at(0, 22), at(1, 20))], zone);
    const days = splitByDay(records, MON + 1, MON + 1, 30);
    expect(days[0].map((s) => [s.startMin, s.endMin])).toEqual([[0, 1200]]);
  });

  it("renders a short event at least one slot tall", () => {
    const [[segment]] = splitByDay(
      readEvents([timed("a", at(0, 9), at(0, 9, 10))], zone),
      MON,
      MON,
      30,
    );
    expect(segment.endMin).toBe(550);
    expect(segment.visualEnd).toBe(570);
  });

  it("keeps an event that ends at the very end of the day inside it", () => {
    const [[segment]] = splitByDay(
      readEvents([timed("a", at(0, 23, 50), at(1, 0))], zone),
      MON,
      MON,
      30,
    );
    expect(segment.visualEnd).toBe(1440);
  });
});

describe("layoutDay", () => {
  it("gives a lone event the full width", () => {
    expect(layoutOf([timed("a", at(0, 9), at(0, 10))])).toEqual({
      a: [0, 1, 1],
    });
  });

  it("puts two overlapping events side by side", () => {
    expect(
      layoutOf([
        timed("a", at(0, 9), at(0, 11)),
        timed("b", at(0, 10), at(0, 12)),
      ]),
    ).toEqual({ a: [0, 2, 1], b: [1, 2, 1] });
  });

  it("lets events that only touch share a lane", () => {
    expect(
      layoutOf([
        timed("a", at(0, 9), at(0, 10)),
        timed("b", at(0, 10), at(0, 11)),
      ]),
    ).toEqual({ a: [0, 1, 1], b: [0, 1, 1] });
  });

  it("reuses a lane once its event is over", () => {
    const layout = layoutOf([
      timed("a", at(0, 9), at(0, 12)),
      timed("b", at(0, 9), at(0, 10)),
      timed("c", at(0, 10), at(0, 11)),
    ]);
    expect(layout).toEqual({ a: [0, 2, 1], b: [1, 2, 1], c: [1, 2, 1] });
  });

  it("widens an event over the lanes nothing else uses", () => {
    // `w` starts when `y` and `z` end, so it grows over both of their lanes.
    const layout = layoutOf([
      timed("x", at(0, 9), at(0, 11)),
      timed("y", at(0, 9), at(0, 10)),
      timed("z", at(0, 9), at(0, 10)),
      timed("w", at(0, 10), at(0, 11)),
    ]);
    expect(layout.x).toEqual([0, 3, 1]);
    expect(layout.w).toEqual([1, 3, 2]);
  });

  it("does not widen over a busy lane", () => {
    const layout = layoutOf([
      timed("a", at(0, 9), at(0, 12)),
      timed("b", at(0, 9), at(0, 10)),
      timed("c", at(0, 9, 30), at(0, 11)),
    ]);
    expect(layout.a).toEqual([0, 3, 1]);
    expect(layout.c).toEqual([2, 3, 1]);
  });

  it("starts a new cluster after a gap", () => {
    expect(
      layoutOf([
        timed("a", at(0, 9), at(0, 10)),
        timed("b", at(0, 9), at(0, 10)),
        timed("c", at(0, 14), at(0, 15)),
      ]),
    ).toEqual({ a: [0, 2, 1], b: [1, 2, 1], c: [0, 1, 1] });
  });

  it("counts the rendered height, not the duration, when events are short", () => {
    // Two 10-minute events 20 minutes apart both render 30 minutes tall.
    expect(
      layoutOf([
        timed("a", at(0, 9), at(0, 9, 10)),
        timed("b", at(0, 9, 20), at(0, 9, 30)),
      ]),
    ).toEqual({ a: [0, 2, 1], b: [1, 2, 1] });
  });

  it("lays out 20 events in one slot and 500 in a week in a few milliseconds", () => {
    const events = [];
    for (let i = 0; i < 20; i++) {
      events.push(timed(`slot-${i}`, at(2, 10), at(2, 10, 30)));
    }
    for (let i = 0; i < 480; i++) {
      const day = i % 7;
      const hour = 7 + ((i * 5) % 12);
      events.push(
        timed(`e${i}`, at(day, hour, (i % 4) * 15), at(day, hour + 1)),
      );
    }
    const records = readEvents(events, zone);
    const started = performance.now();
    const days = splitByDay(records, MON, MON + 6, 30).map(layoutDay);
    const elapsed = performance.now() - started;

    const crowded = days[2].filter((s) => s.record.id.startsWith("slot-"));
    expect(crowded).toHaveLength(20);
    expect(new Set(crowded.map((s) => s.column)).size).toBe(20);
    expect(crowded.every((s) => s.columns >= 20)).toBe(true);
    expect(days.reduce((n, d) => n + d.length, 0)).toBe(500);
    expect(elapsed).toBeLessThan(100);
  });
});

describe("packBars", () => {
  const range = (a: number, b: number, id: string) => ({
    id,
    title: id,
    start: at(a, 0),
    end: at(b + 1, 0),
    allDay: true,
  });

  it("stacks bars that overlap and shares a lane between bars that do not", () => {
    const records = readEvents(
      [range(0, 2, "a"), range(1, 3, "b"), range(3, 4, "c")],
      zone,
    );
    const { bars, lanes } = packBars(records, MON, MON + 6);
    expect(
      Object.fromEntries(
        bars.map((b) => [b.record.id, [b.start, b.span, b.lane]]),
      ),
    ).toEqual({
      a: [0, 3, 0],
      b: [1, 3, 1],
      c: [3, 2, 0],
    });
    expect(lanes).toBe(2);
  });

  it("clips a bar to the row and marks the cut edges", () => {
    const [bar] = packBars(
      readEvents([range(-2, 8, "a")], zone),
      MON,
      MON + 6,
    ).bars;
    expect([
      bar.start,
      bar.span,
      bar.continuesBefore,
      bar.continuesAfter,
    ]).toEqual([0, 7, true, true]);
  });

  it("puts the longer bar first when two start together", () => {
    const { bars } = packBars(
      readEvents([range(0, 0, "short"), range(0, 3, "long")], zone),
      MON,
      MON + 6,
    );
    expect(bars.find((b) => b.record.id === "long")?.lane).toBe(0);
  });

  it("leaves timed events out unless asked for them", () => {
    const records = readEvents([timed("a", at(0, 9), at(0, 10))], zone);
    expect(packBars(records, MON, MON + 6).bars).toHaveLength(0);
    expect(packBars(records, MON, MON + 6, false).bars).toHaveLength(1);
  });

  it("counts what each day hides past the lane limit", () => {
    const records = readEvents(
      [range(0, 1, "a"), range(0, 1, "b"), range(1, 1, "c")],
      zone,
    );
    const { bars } = packBars(records, MON, MON + 6);
    expect(hiddenPerDay(bars, 7, 2)).toEqual([0, 1, 0, 0, 0, 0, 0]);
  });
});

describe("moving and resizing", () => {
  it("moves by a day and minutes, keeping the elapsed length", () => {
    const [record] = readEvents([timed("a", at(0, 9), at(0, 10))], zone);
    const next = moveRecord(record, zone, 1, 30);
    expect(new Date(next.startMs)).toEqual(at(1, 9, 30));
    expect(next.endMs - next.startMs).toBe(3_600_000);
  });

  it("keeps an hour an hour when moved across the spring-forward gap", () => {
    const spring = civilDay(2026, 2, 8);
    const [record] = readEvents(
      [
        timed(
          "a",
          new Date(zone.instant(spring - 1, 60 * 12)),
          new Date(zone.instant(spring - 1, 60 * 13)),
        ),
      ],
      zone,
    );
    // 01:30 to 02:30 on the day before does not exist at 02:30 on the 8th,
    // so move to 01:30 and let the end fall an hour later: 03:30.
    const next = moveRecord(record, zone, 1, -60 * 12 + 90);
    expect(zone.parts(next.startMs)).toEqual({ day: spring, minute: 90 });
    expect(zone.parts(next.endMs)).toEqual({ day: spring, minute: 210 });
    expect(next.endMs - next.startMs).toBe(3_600_000);
  });

  it("moves an all-day event by whole days and keeps its length", () => {
    const [record] = readEvents(
      [{ id: "a", title: "a", start: at(0, 0), end: at(2, 0), allDay: true }],
      zone,
    );
    const next = moveRecord(record, zone, 3, 90);
    expect(new Date(next.startMs)).toEqual(at(3, 0));
    expect(new Date(next.endMs)).toEqual(at(5, 0));
  });

  it("resizes the end to a minute and holds a minimum length", () => {
    const [record] = readEvents([timed("a", at(0, 9), at(0, 10))], zone);
    expect(
      new Date(resizeRecord(record, zone, MON, 11 * 60, 15).endMs),
    ).toEqual(at(0, 11));
    expect(new Date(resizeRecord(record, zone, MON, 8 * 60, 15).endMs)).toEqual(
      at(0, 9, 15),
    );
  });

  it("snaps to the nearest step", () => {
    expect(snapMinute(7, 15)).toBe(0);
    expect(snapMinute(8, 15)).toBe(15);
    expect(snapMinute(-8, 15)).toBe(-15);
  });
});

describe("the DST weeks", () => {
  it("lays out a spring-forward day by the wall clock", () => {
    const spring = civilDay(2026, 2, 8);
    const [[segment]] = splitByDay(
      readEvents(
        [
          timed(
            "a",
            new Date(zone.instant(spring, 60)),
            new Date(zone.instant(spring, 210)),
          ),
        ],
        zone,
      ),
      spring,
      spring,
      30,
    );
    // 01:00 to 03:30 on the wall, though only 1.5 hours pass.
    expect([segment.startMin, segment.endMin]).toEqual([60, 210]);
  });

  it("never gives an event on a fall-back day a negative height", () => {
    const fall = civilDay(2026, 10, 1);
    // 01:30 PDT to 01:15 PST: 45 minutes pass but the wall clock goes back.
    const start = Date.UTC(2026, 10, 1, 8, 30);
    const [[segment]] = splitByDay(
      readEvents(
        [timed("a", new Date(start), new Date(start + 45 * 60_000))],
        zone,
      ),
      fall,
      fall,
      30,
    );
    expect(segment.endMin).toBeGreaterThanOrEqual(segment.startMin);
    expect(segment.visualEnd - segment.startMin).toBe(30);
  });
});
