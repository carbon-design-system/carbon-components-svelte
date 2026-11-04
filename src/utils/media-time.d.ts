/**
 * Pure time math for MediaPlayer and MediaScrubber.
 */

export interface MediaChapter {
  start: number;
  end: number;
  title: string;
}

/** The speeds the speed menu offers: 0.5× to 2×. */
export const PLAYBACK_RATES: ReadonlyArray<number>;

/** Write seconds as a clock: `1:05`, or `1:02:03` from an hour up. */
export function formatClock(seconds: number): string;

/** Write seconds in words for a screen reader: "1 minute 5 seconds". */
export function describeTime(seconds: number, locale?: string): string;

/** Turn a `TimeRanges` into `[start, end]` pairs. */
export function rangesToArray(
  ranges:
    | {
        length: number;
        start(index: number): number;
        end(index: number): number;
      }
    | null
    | undefined,
): Array<[number, number]>;

/** The end of the buffered range that holds `time`, or `time` when none does. */
export function bufferedEnd(
  buffered: ReadonlyArray<readonly [number, number]>,
  time: number,
): number;

/** Whether two lists of buffered ranges are the same. */
export function sameRanges(
  a: ReadonlyArray<readonly [number, number]>,
  b: ReadonlyArray<readonly [number, number]>,
): boolean;

/** Sort chapters, drop those past the end, and give each an end. */
export function resolveChapters(
  chapters: ReadonlyArray<{
    start?: number;
    startTime?: number;
    end?: number;
    endTime?: number;
    title?: string;
    text?: string;
  }>,
  duration: number,
): MediaChapter[];

/** The chapter that holds `time`, if any. */
export function chapterAt(
  chapters: ReadonlyArray<MediaChapter>,
  time: number,
): MediaChapter | undefined;

/** The time a scrubber key moves to, or `null` for a key it ignores. */
export function scrubKeyTarget(
  key: string,
  time: number,
  duration: number,
  step?: number,
): number | null;

/** The time under a pointer on a track that runs from 0 to `duration`. */
export function timeFromPointer(
  clientX: number,
  rect: { left: number; width: number },
  duration: number,
): number;

/** The next speed in the list, one step up or down. */
export function stepRate(
  rate: number,
  direction: 1 | -1,
  rates?: ReadonlyArray<number>,
): number;

/** Write a speed as "1.5×". */
export function formatRate(rate: number, locale?: string): string;
