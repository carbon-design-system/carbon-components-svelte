// @vitest-environment node
import {
  bufferedEnd,
  chapterAt,
  describeTime,
  formatClock,
  formatRate,
  PLAYBACK_RATES,
  rangesToArray,
  resolveChapters,
  scrubKeyTarget,
  stepRate,
  timeFromPointer,
} from "../../src/utils/media-time.js";

describe("formatClock", () => {
  it.each([
    [0, "0:00"],
    [5, "0:05"],
    [65.9, "1:05"],
    [3723, "1:02:03"],
  ])("writes %s as %s", (seconds, text) => {
    expect(formatClock(seconds)).toBe(text);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -4])(
    "reads %s as 0:00",
    (seconds) => {
      expect(formatClock(seconds)).toBe("0:00");
    },
  );
});

describe("describeTime", () => {
  it("says the units in words", () => {
    expect(describeTime(65, "en")).toBe("1 minute 5 seconds");
    expect(describeTime(240, "en")).toBe("4 minutes");
    expect(describeTime(3723, "en")).toBe("1 hour 2 minutes 3 seconds");
  });

  it("says zero seconds for no time", () => {
    expect(describeTime(0, "en")).toBe("0 seconds");
    expect(describeTime(Number.NaN, "en")).toBe("0 seconds");
  });

  it("follows the locale", () => {
    expect(describeTime(65, "de")).toBe("1 Minute 5 Sekunden");
  });
});

describe("buffered ranges", () => {
  it("turns TimeRanges into pairs", () => {
    const ranges = {
      length: 2,
      start: (i: number) => [0, 10][i],
      end: (i: number) => [4, 12][i],
    };
    expect(rangesToArray(ranges)).toEqual([
      [0, 4],
      [10, 12],
    ]);
    expect(rangesToArray(null)).toEqual([]);
  });

  it("finds where the buffer holding a time ends", () => {
    const buffered = [
      [0, 4],
      [10, 12],
    ] as const;
    expect(bufferedEnd(buffered, 2)).toBe(4);
    expect(bufferedEnd(buffered, 11)).toBe(12);
    expect(bufferedEnd(buffered, 7)).toBe(7);
  });
});

describe("chapters", () => {
  it("sorts them, drops those past the end, and ends each at the next", () => {
    expect(
      resolveChapters(
        [
          { start: 30, title: "Two" },
          { startTime: 0, text: " One " },
          { start: 99, title: "Past the end" },
        ],
        60,
      ),
    ).toEqual([
      { start: 0, end: 30, title: "One" },
      { start: 30, end: 60, title: "Two" },
    ]);
  });

  it("finds the chapter that holds a time", () => {
    const chapters = resolveChapters(
      [
        { start: 0, title: "One" },
        { start: 30, title: "Two" },
      ],
      60,
    );
    expect(chapterAt(chapters, 29.9)?.title).toBe("One");
    expect(chapterAt(chapters, 30)?.title).toBe("Two");
    expect(chapterAt([], 5)).toBeUndefined();
  });
});

describe("scrubKeyTarget", () => {
  it.each([
    ["ArrowRight", 20, 25],
    ["ArrowUp", 20, 25],
    ["ArrowLeft", 20, 15],
    ["ArrowDown", 20, 15],
    ["PageUp", 20, 30],
    ["PageDown", 20, 10],
    ["Home", 20, 0],
    ["End", 20, 100],
  ])("%s from %s moves to %s of 100", (key, from, to) => {
    expect(scrubKeyTarget(key, from, 100)).toBe(to);
  });

  it("stays between the ends and ignores other keys", () => {
    expect(scrubKeyTarget("ArrowLeft", 2, 100)).toBe(0);
    expect(scrubKeyTarget("ArrowRight", 98, 100)).toBe(100);
    expect(scrubKeyTarget("a", 2, 100)).toBeNull();
  });

  it("takes the step as an argument", () => {
    expect(scrubKeyTarget("ArrowRight", 0, 100, 2)).toBe(2);
  });
});

describe("timeFromPointer", () => {
  it("maps the pointer onto the duration, left to right", () => {
    const rect = { left: 100, width: 200 };
    expect(timeFromPointer(200, rect, 60)).toBe(30);
    expect(timeFromPointer(0, rect, 60)).toBe(0);
    expect(timeFromPointer(900, rect, 60)).toBe(60);
    expect(timeFromPointer(200, { left: 0, width: 0 }, 60)).toBe(0);
  });
});

describe("speed", () => {
  it("offers 0.5x to 2x", () => {
    expect(PLAYBACK_RATES[0]).toBe(0.5);
    expect(PLAYBACK_RATES.at(-1)).toBe(2);
  });

  it("steps up and down the list and stops at the ends", () => {
    expect(stepRate(1, 1)).toBe(1.25);
    expect(stepRate(1, -1)).toBe(0.75);
    expect(stepRate(2, 1)).toBe(2);
    expect(stepRate(0.5, -1)).toBe(0.5);
  });

  it("moves a speed outside the list to the nearest one in that direction", () => {
    expect(stepRate(1.1, 1)).toBe(1.25);
    expect(stepRate(1.1, -1)).toBe(1);
  });

  it("writes a speed with a times sign", () => {
    expect(formatRate(1.5, "en")).toBe("1.5×");
    expect(formatRate(1, "en")).toBe("1×");
  });
});
