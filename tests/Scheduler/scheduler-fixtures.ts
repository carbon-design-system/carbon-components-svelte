import { civilDay, getZone } from "../../src/Scheduler/scheduler-time.js";

export const LA = "America/Los_Angeles";
const zone = getZone(LA);

/** A Los Angeles wall-clock time as a `Date`, whatever zone the test runs in. */
export function la(
  year: number,
  month: number,
  date: number,
  hour = 0,
  minute = 0,
) {
  return new Date(
    zone.instant(civilDay(year, month - 1, date), hour * 60 + minute),
  );
}

export type Item = {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  color?: string;
  readonly?: boolean;
};
