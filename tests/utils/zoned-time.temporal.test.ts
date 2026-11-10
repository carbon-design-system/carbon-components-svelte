// @vitest-environment node
import {
  addZoned,
  diffCalendarDays,
  endOf,
  fromZoned,
  offsetOf,
  startOf,
  zonedParts,
} from "../../src/utils/zoned-time.js";
import { DAY, MINUTE, wallValue, zoneHistories } from "./zoned-time.helpers";

/**
 * The module against `Temporal`, where the engine has it (Bun, Firefox,
 * Chromium and WebKit now do; Node 24 does not). The same inputs go to both,
 * in every zone, at the clock changes of 2026 and a noon a month, and the
 * answers must match. This is the check that the API maps onto Temporal.
 */

// `Temporal` has no types in this repo's TypeScript.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- no types for Temporal yet.
const T: any = (globalThis as any).Temporal;
const YEAR = 2026;

const zdtAt = (ms: number, zone: string) =>
  T.Instant.fromEpochMilliseconds(ms).toZonedDateTimeISO(zone);

const DISAMBIGUATIONS = ["compatible", "earlier", "later", "reject"] as const;

describe.runIf(T !== undefined)("against Temporal", () => {
  const zones = zoneHistories(YEAR);

  /** Instants to compare at: around each change, and the noons. */
  function samples(changes: number[]) {
    const out: number[] = [];
    for (const change of changes) {
      for (let k = -75; k <= 75; k += 15) out.push(change + k * MINUTE);
    }
    for (let m = 0; m < 12; m++) out.push(Date.UTC(YEAR, m, 15, 12));
    return out;
  }

  it("reads the wall clock, the offset and the day the same", () => {
    const failures: string[] = [];
    for (const { zone, changes } of zones) {
      for (const x of samples(changes)) {
        const z = zdtAt(x, zone);
        const p = zonedParts(x, zone);
        const same =
          p.year === z.year &&
          p.month === z.month &&
          p.day === z.day &&
          p.hour === z.hour &&
          p.minute === z.minute &&
          p.second === z.second &&
          p.millisecond === z.millisecond &&
          p.weekday === z.dayOfWeek % 7 &&
          offsetOf(x, zone) === z.offsetNanoseconds / 1e6 &&
          startOf("day", x, zone) === z.startOfDay().epochMilliseconds &&
          endOf("day", x, zone) ===
            z.add({ days: 1 }).startOfDay().epochMilliseconds - 1;
        if (!same) failures.push(`${zone} ${new Date(x).toISOString()}`);
      }
    }
    expect(failures.slice(0, 10)).toEqual([]);
  });

  it("reads a wall time the same, in every disambiguation", () => {
    const failures: string[] = [];
    for (const { zone, changes } of zones) {
      for (const change of changes) {
        // Wall times from 90 minutes before the change to 90 minutes after
        // the wall clock moved, which takes in the repeated and skipped ones.
        const from = wallValue(change - 1, zone) - 90 * MINUTE;
        const to = wallValue(change, zone) + 90 * MINUTE;
        for (let w = from; w <= to; w += 15 * MINUTE) {
          const d = new Date(w);
          const parts = {
            year: d.getUTCFullYear(),
            month: d.getUTCMonth() + 1,
            day: d.getUTCDate(),
            hour: d.getUTCHours(),
            minute: d.getUTCMinutes(),
          };
          for (const disambiguation of DISAMBIGUATIONS) {
            let expected: number | string;
            try {
              expected = T.ZonedDateTime.from(
                { timeZone: zone, ...parts },
                { disambiguation },
              ).epochMilliseconds;
            } catch {
              expected = "throws";
            }
            let actual: number | string;
            try {
              actual = fromZoned(parts, zone, { disambiguation });
            } catch (error) {
              actual = error instanceof RangeError ? "throws" : "other";
            }
            if (actual !== expected) {
              failures.push(`${zone} ${d.toISOString()} ${disambiguation}`);
            }
          }
        }
      }
    }
    expect(failures.slice(0, 10)).toEqual([]);
  });

  it("adds and counts days the same", () => {
    const failures: string[] = [];
    const durations = [
      { days: 1 },
      { days: -1 },
      { weeks: 1 },
      { months: 1 },
      { months: -1 },
      { years: 1 },
      { days: 1, hours: 1 },
      { hours: 24 },
      { months: 1, days: 3, minutes: 30 },
    ];
    for (const { zone, changes } of zones) {
      for (const x of samples(changes)) {
        const z = zdtAt(x, zone);
        for (const duration of durations) {
          const expected = z.add(duration).epochMilliseconds;
          if (addZoned(x, duration, zone) !== expected) {
            failures.push(
              `${zone} ${new Date(x).toISOString()} ${JSON.stringify(duration)}`,
            );
          }
        }
        const other = x + 3 * DAY + 7 * MINUTE;
        const days = z
          .toPlainDate()
          .until(zdtAt(other, zone).toPlainDate(), { largestUnit: "day" }).days;
        if (diffCalendarDays(x, other, zone) !== days) {
          failures.push(`${zone} ${new Date(x).toISOString()} diff`);
        }
      }
    }
    expect(failures.slice(0, 10)).toEqual([]);
  });

  it("reads the day Samoa skipped the same", () => {
    const zone = "Pacific/Apia";
    for (const hour of [0, 12, 23]) {
      for (const day of [29, 30, 31]) {
        const parts = { year: 2011, month: 12, day, hour };
        for (const disambiguation of DISAMBIGUATIONS) {
          const expected = (() => {
            try {
              return T.ZonedDateTime.from(
                { timeZone: zone, ...parts },
                { disambiguation },
              ).epochMilliseconds;
            } catch {
              return "throws";
            }
          })();
          const actual = (() => {
            try {
              return fromZoned(parts, zone, { disambiguation });
            } catch {
              return "throws";
            }
          })();
          expect(actual).toBe(expected);
        }
      }
    }
  });
});
