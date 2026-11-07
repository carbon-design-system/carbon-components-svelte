// @ts-check
// Pure time math for MediaPlayer and MediaScrubber: no DOM, no Svelte, so it
// runs on the server and is tested in isolation.

import { getNumberFormatter } from "./intl-formatter-cache.js";

/** The speeds the speed menu offers. */
export const PLAYBACK_RATES = Object.freeze([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);

/**
 * @param {unknown} value
 * @returns {number}
 */
function finite(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

/**
 * Write seconds as a clock: `1:05`, or `1:02:03` from an hour up. A value
 * that is not a finite, positive number (a video that has not loaded has a
 * `NaN` duration, a live stream `Infinity`) reads `0:00`.
 * @param {number} seconds
 * @returns {string}
 */
export function formatClock(seconds) {
  const total = Math.floor(finite(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = String(total % 60).padStart(2, "0");
  if (hours === 0) return `${minutes}:${rest}`;
  return `${hours}:${String(minutes).padStart(2, "0")}:${rest}`;
}

/**
 * Write seconds in words for a screen reader: "1 minute 5 seconds". The
 * units come from `Intl`, so the words follow `locale`. A length under a
 * second reads "0 seconds".
 * @param {number} seconds
 * @param {string} [locale]
 * @returns {string}
 */
export function describeTime(seconds, locale) {
  const total = Math.floor(finite(seconds));
  /** @type {Array<[string, number]>} */
  const parts = [
    ["hour", Math.floor(total / 3600)],
    ["minute", Math.floor((total % 3600) / 60)],
    ["second", total % 60],
  ];
  const shown = parts.filter(([, value]) => value > 0);
  if (shown.length === 0) shown.push(["second", 0]);
  return shown
    .map(([unit, value]) =>
      getNumberFormatter(locale, {
        style: "unit",
        unit,
        unitDisplay: "long",
      }).format(value),
    )
    .join(" ");
}

/**
 * Turn a `TimeRanges` into `[start, end]` pairs.
 * @param {{ length: number, start(index: number): number, end(index: number): number } | null | undefined} ranges
 * @returns {Array<[number, number]>}
 */
export function rangesToArray(ranges) {
  /** @type {Array<[number, number]>} */
  const result = [];
  if (!ranges) return result;
  for (let i = 0; i < ranges.length; i++) {
    result.push([ranges.start(i), ranges.end(i)]);
  }
  return result;
}

/**
 * The end of the buffered range that holds `time`, or `time` when nothing
 * covers it.
 * @param {ReadonlyArray<readonly [number, number]>} buffered
 * @param {number} time
 * @returns {number}
 */
export function bufferedEnd(buffered, time) {
  for (const [start, end] of buffered) {
    if (time >= start && time <= end) return end;
  }
  return time;
}

/**
 * Whether two lists of buffered ranges are the same.
 * @param {ReadonlyArray<readonly [number, number]>} a
 * @param {ReadonlyArray<readonly [number, number]>} b
 * @returns {boolean}
 */
export function sameRanges(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
  }
  return true;
}

/**
 * @typedef {{ start: number, end: number, title: string }} MediaChapter
 */

/**
 * Normalize chapters: sort by start, drop those past the end, and give each
 * an end (the next chapter's start, else the duration). Accepts the cues of
 * a `kind="chapters"` text track, whose `text` is the title.
 * @param {ReadonlyArray<{ start?: number, startTime?: number, end?: number, endTime?: number, title?: string, text?: string }>} chapters
 * @param {number} duration
 * @returns {MediaChapter[]}
 */
export function resolveChapters(chapters, duration) {
  const total = finite(duration);
  const sorted = chapters
    .map((chapter) => ({
      start: finite(chapter.start ?? chapter.startTime),
      end: chapter.end ?? chapter.endTime,
      title: String(chapter.title ?? chapter.text ?? "").trim(),
    }))
    .filter((chapter) => total === 0 || chapter.start < total)
    .sort((a, b) => a.start - b.start);
  return sorted.map((chapter, index) => ({
    start: chapter.start,
    end: sorted[index + 1]?.start ?? (total || chapter.end || chapter.start),
    title: chapter.title,
  }));
}

/**
 * The chapter that holds `time`, if any.
 * @param {ReadonlyArray<MediaChapter>} chapters
 * @param {number} time
 * @returns {MediaChapter | undefined}
 */
export function chapterAt(chapters, time) {
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (time >= chapters[i].start) return chapters[i];
  }
  return undefined;
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * The time a scrubber key moves to, or `null` for a key it ignores. Arrow
 * keys move `step` seconds (Up and Down as Right and Left, as on any
 * slider), Page Up and Page Down move a tenth of the duration, and Home
 * and End go to the ends. The result stays between 0 and `duration`.
 * Arrow keys do not mirror in RTL: a timeline reads left to right.
 * @param {string} key
 * @param {number} time
 * @param {number} duration
 * @param {number} [step]
 * @returns {number | null}
 */
export function scrubKeyTarget(key, time, duration, step = 5) {
  const total = finite(duration);
  const page = total / 10;
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return clamp(time + step, 0, total);
    case "ArrowLeft":
    case "ArrowDown":
      return clamp(time - step, 0, total);
    case "PageUp":
      return clamp(time + page, 0, total);
    case "PageDown":
      return clamp(time - page, 0, total);
    case "Home":
      return 0;
    case "End":
      return total;
    default:
      return null;
  }
}

/**
 * The time under a pointer on a track that runs from 0 to `duration`, left
 * to right.
 * @param {number} clientX
 * @param {{ left: number, width: number }} rect
 * @param {number} duration
 * @returns {number}
 */
export function timeFromPointer(clientX, rect, duration) {
  if (!(rect.width > 0)) return 0;
  return clamp((clientX - rect.left) / rect.width, 0, 1) * finite(duration);
}

/**
 * The next speed in the list: one step up or down from `rate`, stopping at
 * the ends. A speed that is not in the list moves to the nearest one that
 * lies in the direction asked.
 * @param {number} rate
 * @param {1 | -1} direction
 * @param {ReadonlyArray<number>} [rates]
 * @returns {number}
 */
export function stepRate(rate, direction, rates = PLAYBACK_RATES) {
  if (direction > 0) {
    return rates.find((value) => value > rate) ?? rates[rates.length - 1];
  }
  for (let i = rates.length - 1; i >= 0; i--) {
    if (rates[i] < rate) return rates[i];
  }
  return rates[0];
}

/**
 * Write a speed as "1.5×".
 * @param {number} rate
 * @param {string} [locale]
 * @returns {string}
 */
export function formatRate(rate, locale) {
  return `${getNumberFormatter(locale, { maximumFractionDigits: 2 }).format(rate)}×`;
}
