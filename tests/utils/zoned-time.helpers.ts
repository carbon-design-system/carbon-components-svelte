import {
  listTimeZones,
  offsetOf,
  zonedParts,
} from "../../src/utils/zoned-time.js";

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** The wall clock as milliseconds, so two wall times can be subtracted. */
export function wallValue(time: number, zone: string) {
  const w = zonedParts(time, zone);
  return Date.UTC(
    w.year,
    w.month - 1,
    w.day,
    w.hour,
    w.minute,
    w.second,
    w.millisecond,
  );
}

/** The instants in `year` at which the offset of `zone` changes. */
export function transitions(zone: string, year: number): number[] {
  const found: number[] = [];
  let lo = Date.UTC(year, 0, 1);
  let offset = offsetOf(lo, zone);
  const end = Date.UTC(year + 1, 0, 1);
  for (let hi = lo + DAY; hi <= end; hi += DAY) {
    const next = offsetOf(hi, zone);
    if (next !== offset) {
      // The first instant with the new offset.
      let a = lo;
      let b = hi;
      while (b - a > 1) {
        const mid = Math.floor((a + b) / 2);
        if (offsetOf(mid, zone) === offset) a = mid;
        else b = mid;
      }
      found.push(b);
    }
    lo = hi;
    offset = next;
  }
  return found;
}

/**
 * Every zone the engine lists, with its clock changes in `year` and a
 * `history`: zones with the same history behave the same in every function
 * of the module.
 */
export function zoneHistories(year: number) {
  return listTimeZones().map((zone) => {
    const changes = transitions(zone, year);
    const history = [offsetOf(Date.UTC(year, 0, 1), zone)]
      .concat(changes.flatMap((c) => [c, offsetOf(c, zone)]))
      .join(",");
    return { zone, changes, history };
  });
}
