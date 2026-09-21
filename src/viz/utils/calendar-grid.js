// @ts-check
// Lay the days of a year out as week columns for a calendar heatmap.

const DAY = 86_400_000;

/** @param {Date} date */
function isoDate(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${date.getFullYear()}-${m < 10 ? "0" : ""}${m}-${d < 10 ? "0" : ""}${d}`;
}

/**
 * One column per week of `year`, each with seven day slots that start on
 * `weekStart`. Slots outside the year are `null`. Values of rows that fall on
 * the same day are summed; a day with no rows has a `null` value. Dates are
 * read in local time.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./calendar-grid.d.ts").CalendarGridOptions<T>} options
 * @returns {import("./calendar-grid.d.ts").CalendarGrid<T>}
 */
export function buildCalendarGrid(rows, options) {
  const { date, value, weekStart = 0 } = options;

  /** @type {Map<string, { value: number; data: T[] }>} */
  const byDay = new Map();
  let latest = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < rows.length; i++) {
    const raw = date(rows[i], i);
    const at = raw instanceof Date ? raw : new Date(/** @type {any} */ (raw));
    const amount = Number(value(rows[i], i));
    if (Number.isNaN(at.getTime()) || !Number.isFinite(amount)) continue;
    if (at.getTime() > latest) latest = at.getTime();
    const key = isoDate(at);
    const entry = byDay.get(key);
    if (entry) {
      entry.value += amount;
      entry.data.push(rows[i]);
    } else {
      byDay.set(key, { value: amount, data: [rows[i]] });
    }
  }

  const year =
    options.year ??
    (Number.isFinite(latest)
      ? new Date(latest).getFullYear()
      : new Date().getFullYear());
  const first = new Date(year, 0, 1);
  const offset = (first.getDay() - weekStart + 7) % 7;
  const daysInYear = Math.round(
    (new Date(year + 1, 0, 1).getTime() - first.getTime()) / DAY,
  );
  const weekCount = Math.ceil((offset + daysInYear) / 7);

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  /** @type {import("./calendar-grid.d.ts").CalendarWeek<T>[]} */
  const weeks = [];
  /** @type {import("./calendar-grid.d.ts").CalendarMonth[]} */
  const months = [];
  for (let w = 0; w < weekCount; w++) {
    /** @type {Array<import("./calendar-grid.d.ts").CalendarDay<T> | null>} */
    const days = new Array(7).fill(null);
    for (let d = 0; d < 7; d++) {
      const n = w * 7 + d - offset;
      if (n < 0 || n >= daysInYear) continue;
      // Built from parts, so a daylight saving shift never skips a day.
      const at = new Date(year, 0, 1 + n);
      const iso = isoDate(at);
      const entry = byDay.get(iso);
      if (entry) {
        if (entry.value < min) min = entry.value;
        if (entry.value > max) max = entry.value;
      }
      days[d] = {
        date: at,
        iso,
        week: w,
        weekday: d,
        value: entry ? entry.value : null,
        data: entry ? entry.data : [],
      };
      if (at.getDate() === 1) months.push({ month: at.getMonth(), week: w });
    }
    weeks.push({ index: w, days });
  }
  if (!Number.isFinite(min)) {
    min = 0;
    max = 0;
  }

  // A month's label spans from its first week to the next month's.
  const spans = months.map((entry, i) => ({
    ...entry,
    span: (i + 1 < months.length ? months[i + 1].week : weekCount) - entry.week,
  }));
  const weekdays = Array.from({ length: 7 }, (_, d) => (weekStart + d) % 7);

  return { year, weeks, months: spans, weekdays, min, max };
}
