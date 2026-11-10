// @vitest-environment node
import {
  addZoned,
  dayKey,
  diffCalendarDays,
  endOf,
  fromZoned,
  offsetOf,
  startOf,
  zonedParts,
} from "../../src/utils/zoned-time.js";
import {
  DAY,
  HOUR,
  MINUTE,
  wallValue,
  zoneHistories,
} from "./zoned-time.helpers";

/**
 * Every zone the engine lists, over a year of days and around every clock
 * change. A zone sweep found the Havana and Santiago start-of-day rule that
 * fixed cases did not, so these invariants are about all zones, not about
 * the six named in zoned-time.test.ts.
 *
 * Zones with the same offsets at the same instants in the year behave the
 * same in every function here, so the day-by-day checks run once per
 * distinct history (67 of the 445 zones in Bun). The clock change checks
 * run for every zone. `ZONED_TIME_FULL_SWEEP=1` runs every zone through
 * every check, and adds a pass over every half hour of 2011 (the year Samoa
 * skipped a day) and 2026: about 6 seconds, then 4 and a half minutes.
 */

const YEAR = 2026;
const FULL = process.env.ZONED_TIME_FULL_SWEEP === "1";
const TIMEOUT = 600_000;

const key = (year: number, month: number, day: number) => {
  const d = new Date(Date.UTC(year, month - 1, day));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
};

const zones = zoneHistories(YEAR);

/** One zone for each distinct history, or every zone for the full sweep. */
const distinct = FULL
  ? zones
  : [...new Map(zones.map((z) => [z.history, z])).values()];

describe("zone sweep", () => {
  it("covers every zone the engine lists, and a spread of histories", () => {
    expect(zones.length).toBeGreaterThan(400);
    expect(distinct.length).toBeGreaterThan(30);
    // Zones that change the clocks by 30 minutes, by 2 hours, or not at all.
    const shifts = new Set(
      zones.flatMap(({ zone, changes }) =>
        changes.map(
          (c) => (offsetOf(c, zone) - offsetOf(c - 1, zone)) / MINUTE,
        ),
      ),
    );
    expect(shifts).toContain(60);
    expect(shifts).toContain(-60);
    expect(shifts).toContain(30);
    expect(shifts).toContain(-30);
    expect(zones.some(({ changes }) => changes.length === 0)).toBe(true);
  });

  it(
    "tiles every day of the year, with no gap and no overlap",
    () => {
      const failures: string[] = [];
      for (const { zone, changes } of distinct) {
        let s = fromZoned({ year: YEAR, month: 1, day: 1 }, zone);
        let total = 0;
        for (let k = 0; k < 365; k++) {
          const today = key(YEAR, 1, 1 + k);
          const next = startOf("day", s + 36 * HOUR, zone);
          const length = next - s;
          let ok =
            dayKey(s, zone) === today &&
            dayKey(s - 1, zone) === key(YEAR, 1, k) &&
            // 22 (Troll), 23, 23.5, 24, 24.5, 25 or 26 hours.
            length >= 22 * HOUR &&
            length <= 26 * HOUR &&
            length % (30 * MINUTE) === 0;
          // The end of the day is the start of the next, on the days where
          // it could differ.
          const near = changes.some((c) => Math.abs(c - s) < 3 * DAY);
          if (ok && (near || k % 7 === 0 || today.endsWith("-01"))) {
            const e = endOf("day", s, zone);
            ok =
              e + 1 === next &&
              dayKey(e, zone) === today &&
              diffCalendarDays(s, next, zone) === 1;
          }
          if (!ok) failures.push(`${zone} ${today}: ${s} ${next}`);
          total += length;
          s = next;
        }
        const end = fromZoned({ year: YEAR + 1, month: 1, day: 1 }, zone);
        if (s !== end) failures.push(`${zone}: ends at ${s}, not ${end}`);
        if (total !== end - fromZoned({ year: YEAR, month: 1, day: 1 }, zone)) {
          failures.push(`${zone}: days sum to ${total}`);
        }
      }
      expect(failures.slice(0, 10)).toEqual([]);
    },
    TIMEOUT,
  );

  it(
    "reads each wall time back, or as the time after a gap, around every clock change",
    () => {
      const failures: string[] = [];
      let checked = 0;
      for (const { zone, changes } of zones) {
        for (const change of changes) {
          const gap = offsetOf(change, zone) - offsetOf(change - 1, zone);
          // The wall times that happen twice, if the clocks went back.
          const w2 = wallValue(change, zone);
          const w1 = wallValue(change - 1, zone) + 1;
          // Every 5 minutes, an hour and a half either side.
          for (let k = -90; k <= 90; k += 5) {
            const x = change + k * MINUTE;
            const p = zonedParts(x, zone);
            const wall = wallValue(x, zone);
            const earlier = fromZoned(p, zone, { disambiguation: "earlier" });
            const later = fromZoned(p, zone, { disambiguation: "later" });
            checked++;
            const ok =
              // The instant is one of the two readings of its own wall time.
              (x === earlier || x === later) &&
              earlier <= later &&
              fromZoned(p, zone) === earlier &&
              wallValue(earlier, zone) === wall &&
              wallValue(later, zone) === wall &&
              // Two readings in a repeated hour, and one anywhere else.
              (earlier !== later) === (gap < 0 && w2 <= wall && wall < w1);
            if (!ok) failures.push(`${zone} ${new Date(x).toISOString()}`);
          }
          if (gap > 0) {
            // The skipped times, every 5 minutes.
            const before = w1;
            for (let w = before; w < before + gap; w += 5 * MINUTE) {
              const p = new Date(w);
              const parts = {
                year: p.getUTCFullYear(),
                month: p.getUTCMonth() + 1,
                day: p.getUTCDate(),
                hour: p.getUTCHours(),
                minute: p.getUTCMinutes(),
              };
              const later = fromZoned(parts, zone, { disambiguation: "later" });
              const earlier = fromZoned(parts, zone, {
                disambiguation: "earlier",
              });
              checked++;
              const ok =
                fromZoned(parts, zone) === later &&
                wallValue(later, zone) === w + gap &&
                wallValue(earlier, zone) === w - gap &&
                later - earlier === gap;
              if (!ok) failures.push(`${zone} gap ${p.toISOString()}`);
            }
          }
        }
      }
      expect(checked).toBeGreaterThan(10_000);
      expect(failures.slice(0, 10)).toEqual([]);
    },
    TIMEOUT,
  );

  it(
    "adds a calendar day as the same wall time, day after day",
    () => {
      const failures: string[] = [];
      for (const { zone, changes } of distinct) {
        let noon = fromZoned({ year: YEAR, month: 1, day: 1, hour: 12 }, zone);
        for (let k = 0; k < 365; k++) {
          const next = addZoned(noon, { days: 1 }, zone);
          const w = zonedParts(next, zone);
          let ok =
            w.hour === 12 &&
            w.minute === 0 &&
            dayKey(next, zone) === key(YEAR, 1, 2 + k);
          if (ok && changes.some((c) => Math.abs(c - noon) < 2 * DAY)) {
            ok =
              addZoned(next, { days: -1 }, zone) === noon &&
              diffCalendarDays(noon, next, zone) === 1 &&
              // Across a clock change, 24 hours is not a day.
              (next - noon === DAY) ===
                (addZoned(noon, { hours: 24 }, zone) === next);
          }
          if (!ok) failures.push(`${zone} ${key(YEAR, 1, 1 + k)}`);
          noon = next;
        }
      }
      expect(failures.slice(0, 10)).toEqual([]);
    },
    TIMEOUT,
  );

  it.runIf(FULL)(
    "reads every half hour of 2011 and 2026 back in every zone",
    () => {
      const failures: string[] = [];
      let checked = 0;
      for (const { zone } of zones) {
        for (const year of [2011, YEAR]) {
          const end = Date.UTC(year + 1, 0, 1);
          for (let x = Date.UTC(year, 0, 1); x < end; x += 30 * MINUTE) {
            const p = zonedParts(x, zone);
            const earlier = fromZoned(p, zone, { disambiguation: "earlier" });
            const later = fromZoned(p, zone, { disambiguation: "later" });
            checked++;
            if (x !== earlier && x !== later) {
              failures.push(`${zone} ${new Date(x).toISOString()}`);
            }
          }
        }
      }
      expect(checked).toBeGreaterThan(1_000_000);
      expect(failures.slice(0, 10)).toEqual([]);
    },
    TIMEOUT,
  );
});
