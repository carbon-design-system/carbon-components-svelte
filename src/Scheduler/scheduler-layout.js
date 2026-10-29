// @ts-check
import { DAY_MS, MINUTES_PER_DAY } from "./scheduler-time.js";

/**
 * @typedef {import("./scheduler-time.js").CivilDay} CivilDay
 * @typedef {import("./scheduler-time.js").Zone} Zone
 */

/**
 * An event read once into the numbers the layout needs.
 *
 * @typedef {object} EventRecord
 * @property {any} event - The consumer's event object.
 * @property {string} id
 * @property {number} order - Position in the input, to keep a stable sort.
 * @property {number} startMs
 * @property {number} endMs
 * @property {boolean} allDay - The event sets `allDay`.
 * @property {boolean} banner - Lives in the all-day row: an `allDay` event, or a timed one lasting 24 hours or more.
 * @property {CivilDay} startDay
 * @property {CivilDay} lastDay - The last day the event touches, inclusive.
 * @property {number} startMinute - Wall-clock minute of the start on `startDay`.
 * @property {number} endMinute - Wall-clock minute of the end on `lastDay`; 1440 when the event ends at midnight.
 */

/**
 * One day's slice of a timed event, with the place the overlap layout gave it.
 *
 * @typedef {object} Segment
 * @property {EventRecord} record
 * @property {string} key
 * @property {CivilDay} day
 * @property {number} startMin
 * @property {number} endMin
 * @property {number} visualEnd - `endMin`, or one slot after `startMin` when the event is shorter than that.
 * @property {boolean} continuesBefore - The event started on an earlier day.
 * @property {boolean} continuesAfter - The event ends on a later day.
 * @property {number} column - Zero-based lane among the events it overlaps.
 * @property {number} columns - Lanes in its cluster of overlapping events.
 * @property {number} span - Lanes it covers, from `column`: it grows into free lanes on its inline-end side.
 */

/**
 * @param {Date | number | undefined | null} value
 */
function toMs(value) {
  const ms = value instanceof Date ? value.getTime() : Number(value);
  return Number.isFinite(ms) ? ms : Number.NaN;
}

/**
 * Reads each event into an {@link EventRecord}. An event with an invalid
 * `start` is skipped. A missing or earlier `end` makes the event last
 * nothing (a timed one) or a single day (an all-day one).
 *
 * `end` is exclusive, as in iCalendar and Google Calendar: an all-day event
 * on Monday ends at Tuesday's midnight.
 *
 * @param {ReadonlyArray<any>} events
 * @param {Zone} zone
 * @returns {EventRecord[]}
 */
export function readEvents(events, zone) {
  /** @type {EventRecord[]} */
  const records = [];
  for (let order = 0; order < events.length; order++) {
    const event = events[order];
    const startMs = toMs(event?.start);
    if (Number.isNaN(startMs)) continue;
    const rawEnd = toMs(event.end);
    const endMs = Number.isNaN(rawEnd) ? startMs : Math.max(rawEnd, startMs);
    const allDay = event.allDay === true;
    const start = zone.parts(startMs);
    const end = endMs > startMs ? zone.parts(endMs - 1) : start;
    const endParts = endMs > startMs ? zone.parts(endMs) : start;
    records.push({
      event,
      id: String(event.id ?? order),
      order,
      startMs,
      endMs,
      allDay,
      banner: allDay || endMs - startMs >= DAY_MS,
      startDay: start.day,
      lastDay: end.day,
      startMinute: allDay ? 0 : start.minute,
      endMinute: allDay
        ? MINUTES_PER_DAY
        : endParts.day === end.day
          ? endParts.minute
          : MINUTES_PER_DAY,
    });
  }
  return records;
}

/**
 * Splits the timed events into one segment per day they touch, for the days
 * `firstDay` through `lastDay`. An overnight event gets a segment on each
 * side of midnight.
 *
 * @param {ReadonlyArray<EventRecord>} records
 * @param {CivilDay} firstDay
 * @param {CivilDay} lastDay
 * @param {number} minMinutes - The least an event renders as tall, in minutes.
 * @returns {Segment[][]} One list per day.
 */
export function splitByDay(records, firstDay, lastDay, minMinutes) {
  /** @type {Segment[][]} */
  const days = Array.from({ length: lastDay - firstDay + 1 }, () => []);
  for (const record of records) {
    if (record.banner) continue;
    if (record.lastDay < firstDay || record.startDay > lastDay) continue;
    const from = Math.max(record.startDay, firstDay);
    const to = Math.min(record.lastDay, lastDay);
    for (let day = from; day <= to; day++) {
      const startMin = day === record.startDay ? record.startMinute : 0;
      // On the repeated hour of a fall-back day the wall clock runs
      // backward, so an end can read earlier than its start.
      const endMin = Math.max(
        startMin,
        day === record.lastDay ? record.endMinute : MINUTES_PER_DAY,
      );
      days[day - firstDay].push({
        record,
        key: `${record.id}:${day - record.startDay}`,
        day,
        startMin,
        endMin,
        visualEnd: Math.max(endMin, Math.min(startMin + minMinutes, 1440)),
        continuesBefore: day > record.startDay,
        continuesAfter: day < record.lastDay,
        column: 0,
        columns: 1,
        span: 1,
      });
    }
  }
  return days;
}

/**
 * Lays out one day's overlapping segments side by side, as Google Calendar
 * does, and sets `column`, `columns` and `span` on each.
 *
 * Segments that touch through a chain of overlaps form a cluster. Each
 * segment takes the first lane in its cluster that is free when it starts,
 * so a cluster is as many lanes wide as its busiest moment needs. Then a
 * segment grows over the lanes to its inline-end side that nothing else
 * occupies during its time, so a lone meeting beside a busy hour fills its
 * row instead of leaving a gap.
 *
 * Runs in O(n log n + n * columns). Sorts in place.
 *
 * @param {Segment[]} segments
 * @returns {Segment[]} The same array.
 */
export function layoutDay(segments) {
  segments.sort(
    (a, b) =>
      a.startMin - b.startMin ||
      b.visualEnd - a.visualEnd ||
      a.record.order - b.record.order,
  );

  /** @type {Segment[]} */
  let cluster = [];
  /** @type {number[]} */
  let laneEnds = [];
  let clusterEnd = -1;

  function close() {
    const columns = laneEnds.length;
    /** @type {Segment[][]} */
    const lanes = Array.from({ length: columns }, () => []);
    for (const segment of cluster) lanes[segment.column].push(segment);
    for (const segment of cluster) {
      segment.columns = columns;
      let span = 1;
      for (let lane = segment.column + 1; lane < columns; lane++) {
        if (!lanes[lane].every((other) => !overlaps(segment, other))) break;
        span++;
      }
      segment.span = span;
    }
    cluster = [];
    laneEnds = [];
    clusterEnd = -1;
  }

  for (const segment of segments) {
    if (cluster.length > 0 && segment.startMin >= clusterEnd) close();
    let lane = laneEnds.findIndex((end) => end <= segment.startMin);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = segment.visualEnd;
    segment.column = lane;
    cluster.push(segment);
    clusterEnd = Math.max(clusterEnd, segment.visualEnd);
  }
  if (cluster.length > 0) close();
  return segments;
}

/**
 * @param {Segment} a
 * @param {Segment} b
 */
function overlaps(a, b) {
  return a.startMin < b.visualEnd && b.startMin < a.visualEnd;
}

/**
 * A bar across days: an all-day event in the all-day row, or any event in a
 * month week.
 *
 * @typedef {object} Bar
 * @property {EventRecord} record
 * @property {string} key
 * @property {number} start - Zero-based day index within the row where the bar begins.
 * @property {number} span - Days it covers within the row.
 * @property {number} lane - Zero-based row among the bars it overlaps.
 * @property {boolean} continuesBefore
 * @property {boolean} continuesAfter
 */

/**
 * Packs events that cover whole days into lanes, as the all-day row and the
 * month weeks show them. A longer bar takes the higher lane when two start
 * together. A timed event shorter than a day keeps to the day it starts on,
 * even when it ends after midnight, so its text stays in that day's cell.
 *
 * @param {ReadonlyArray<EventRecord>} records
 * @param {CivilDay} firstDay
 * @param {CivilDay} lastDay
 * @param {boolean} [bannersOnly] Skip the timed events, which month view keeps.
 * @returns {{ bars: Bar[]; lanes: number }}
 */
export function packBars(records, firstDay, lastDay, bannersOnly = true) {
  /** @param {EventRecord} record */
  const lastShown = (record) =>
    record.banner ? record.lastDay : record.startDay;
  const inRange = records.filter(
    (record) =>
      lastShown(record) >= firstDay &&
      record.startDay <= lastDay &&
      (record.banner || !bannersOnly),
  );
  inRange.sort(
    (a, b) =>
      Math.max(a.startDay, firstDay) - Math.max(b.startDay, firstDay) ||
      Number(b.banner) - Number(a.banner) ||
      lastShown(b) - b.startDay - (lastShown(a) - a.startDay) ||
      a.startMs - b.startMs ||
      a.order - b.order,
  );

  /** @type {number[]} */
  const laneEnds = [];
  /** @type {Bar[]} */
  const bars = [];
  for (const record of inRange) {
    const start = Math.max(record.startDay, firstDay) - firstDay;
    const end = Math.min(lastShown(record), lastDay) - firstDay;
    let lane = laneEnds.findIndex((laneEnd) => laneEnd < start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = end;
    bars.push({
      record,
      key: `${record.id}:${firstDay}`,
      start,
      span: end - start + 1,
      lane,
      continuesBefore: record.startDay < firstDay,
      continuesAfter: lastShown(record) > lastDay,
    });
  }
  return { bars, lanes: laneEnds.length };
}

/**
 * How many bars each day hides when only `limit` lanes show.
 *
 * @param {ReadonlyArray<Bar>} bars
 * @param {number} days
 * @param {number} limit
 * @returns {number[]}
 */
export function hiddenPerDay(bars, days, limit) {
  const hidden = Array.from({ length: days }, () => 0);
  for (const bar of bars) {
    if (bar.lane < limit) continue;
    for (let day = bar.start; day < bar.start + bar.span; day++) hidden[day]++;
  }
  return hidden;
}

/**
 * @param {number} minute
 * @param {number} step
 */
export function snapMinute(minute, step) {
  return Math.round(minute / step) * step;
}

/**
 * Where an event lands when moved. The duration is the time that passes,
 * not the clock difference, so moving a one-hour event over a DST change
 * keeps it one hour long.
 *
 * An all-day event moves by whole days and keeps its length in days.
 *
 * @param {EventRecord} record
 * @param {Zone} zone
 * @param {number} dayDelta
 * @param {number} minuteDelta
 * @returns {{ startMs: number; endMs: number }}
 */
export function moveRecord(record, zone, dayDelta, minuteDelta) {
  if (record.allDay) {
    return {
      startMs: zone.instant(record.startDay + dayDelta, 0),
      endMs: zone.instant(record.lastDay + dayDelta + 1, 0),
    };
  }
  const startMs = zone.instant(
    record.startDay + dayDelta,
    record.startMinute + minuteDelta,
  );
  return { startMs, endMs: startMs + (record.endMs - record.startMs) };
}

/**
 * Where an event ends after its bottom edge moves to a wall-clock time. The
 * event keeps at least `minMinutes`.
 *
 * @param {EventRecord} record
 * @param {Zone} zone
 * @param {CivilDay} day
 * @param {number} minute
 * @param {number} minMinutes
 * @returns {{ startMs: number; endMs: number }}
 */
export function resizeRecord(record, zone, day, minute, minMinutes) {
  const endMs = Math.max(
    zone.instant(day, minute),
    record.startMs + minMinutes * 60_000,
  );
  return { startMs: record.startMs, endMs };
}
