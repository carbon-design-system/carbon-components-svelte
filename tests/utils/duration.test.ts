import {
  clampDuration,
  formatCompactDuration,
  formatDuration,
  formatISODuration,
  joinDuration,
  parseDuration,
  segmentDigits,
  segmentMax,
  snapDuration,
  splitDuration,
  stepDuration,
  typeDigit,
  unitLabel,
  unitRange,
} from "carbon-components-svelte/utils/duration";

const HOUR = 3_600_000;
const MINUTE = 60_000;
const hms = unitRange("hour", "second");

describe("unitRange", () => {
  it("slices the units from largest to smallest", () => {
    expect(unitRange("day", "minute")).toEqual(["day", "hour", "minute"]);
    expect(unitRange("hour", "millisecond")).toEqual([
      "hour",
      "minute",
      "second",
      "millisecond",
    ]);
  });

  it("collapses a smallest unit above the largest", () => {
    expect(unitRange("minute", "hour")).toEqual(["minute"]);
  });
});

describe("splitDuration", () => {
  it("gives the largest unit everything above it", () => {
    expect(splitDuration(100 * HOUR + 5 * MINUTE, hms)).toEqual({
      hour: 100,
      minute: 5,
      second: 0,
    });
  });

  it("round trips through joinDuration and drops what is below the smallest", () => {
    expect(joinDuration(splitDuration(5_400_999, hms))).toBe(5_400_000);
  });
});

describe("segmentMax", () => {
  it("bounds every segment but the largest by its parent", () => {
    const units = unitRange("day", "millisecond");
    expect(units.map((unit) => segmentMax(unit, units, undefined))).toEqual([
      Number.POSITIVE_INFINITY,
      23,
      59,
      59,
      999,
    ]);
  });

  it("bounds the largest by `max`", () => {
    expect(segmentMax("hour", hms, 2.5 * HOUR)).toBe(2);
  });
});

describe("clampDuration", () => {
  it("lets `min` win over a smaller `max`", () => {
    expect(clampDuration(5, 10, 3)).toBe(10);
    expect(clampDuration(-5, undefined, undefined)).toBe(0);
  });
});

describe("stepDuration", () => {
  const options = { smallest: "second" } as const;

  it("carries into the segment above", () => {
    expect(stepDuration(HOUR - MINUTE, "minute", 1, options)).toBe(HOUR);
  });

  it("borrows from the segment above", () => {
    expect(stepDuration(HOUR, "minute", -1, options)).toBe(HOUR - MINUTE);
  });

  it("stops at the bounds", () => {
    expect(stepDuration(0, "second", -1, options)).toBe(0);
    expect(stepDuration(HOUR, "hour", 1, { ...options, max: HOUR })).toBe(HOUR);
    expect(stepDuration(null, "minute", 1, options)).toBe(MINUTE);
  });

  it("moves the smallest segment to the next multiple of `step`", () => {
    const stepped = { smallest: "minute", step: 5 } as const;
    expect(stepDuration(7 * MINUTE, "minute", 1, stepped)).toBe(10 * MINUTE);
    expect(stepDuration(7 * MINUTE, "minute", -1, stepped)).toBe(5 * MINUTE);
    expect(stepDuration(10 * MINUTE, "minute", -1, stepped)).toBe(5 * MINUTE);
    expect(
      stepDuration(10 * MINUTE, "minute", 1, { ...stepped, count: 3 }),
    ).toBe(25 * MINUTE);
  });
});

describe("typeDigit", () => {
  it("is done once no digit could extend the count", () => {
    expect(typeDigit("", "7", 59, 2)).toMatchObject({ count: 7, done: true });
    expect(typeDigit("", "1", 59, 2)).toMatchObject({ count: 1, done: false });
    expect(typeDigit("1", "5", 59, 2)).toMatchObject({ count: 15, done: true });
  });

  it("starts over when the count would pass the limit", () => {
    expect(typeDigit("6", "5", 59, 2)).toEqual({
      buffer: "5",
      count: 5,
      done: false,
    });
  });

  it("clamps a digit that is itself over the limit", () => {
    expect(typeDigit("", "9", 2, 2).count).toBe(2);
  });

  it("moves on after two digits in a segment with no limit", () => {
    const limit = Number.POSITIVE_INFINITY;
    expect(segmentDigits(limit)).toBe(2);
    expect(typeDigit("2", "4", limit, segmentDigits(limit))).toMatchObject({
      count: 24,
      done: true,
    });
    expect(typeDigit("24", "5", limit, 2).buffer).toBe("5");
  });

  it("makes room for the digits of a `max`", () => {
    expect(segmentDigits(200)).toBe(3);
    expect(segmentDigits(59)).toBe(2);
  });
});

describe("snapDuration", () => {
  it("rounds to the nearest step of the smallest unit", () => {
    expect(snapDuration(22 * MINUTE, "minute", 15)).toBe(15 * MINUTE);
    expect(snapDuration(23 * MINUTE, "minute", 15)).toBe(30 * MINUTE);
    expect(snapDuration(1499, "second")).toBe(1000);
  });
});

describe("parseDuration", () => {
  it.each([
    ["1h 30m", 90 * MINUTE],
    ["90m", 90 * MINUTE],
    ["1.5h", 90 * MINUTE],
    ["1,5h", 90 * MINUTE],
    ["1 hour, 30 minutes", 90 * MINUTE],
    ["1h and 30m", 90 * MINUTE],
    ["1d 2h", 26 * HOUR],
    ["250ms", 250],
    ["1:30", 90 * MINUTE],
    ["1:30:15", 90 * MINUTE + 15_000],
    ["1:30:15.25", 90 * MINUTE + 15_250],
    ["PT1H30M", 90 * MINUTE],
    ["pt1h30m", 90 * MINUTE],
    ["P1DT2H", 26 * HOUR],
    ["P1W", 168 * HOUR],
    ["PT0.5S", 500],
    ["٣٠m", 30 * MINUTE],
    ["90", 90 * MINUTE],
  ])("reads %s", (text, expected) => {
    expect(parseDuration(text)).toBe(expected);
  });

  it("counts a bare number in `bareUnit`", () => {
    expect(parseDuration("90", "second")).toBe(90_000);
  });

  it("returns null for empty text", () => {
    expect(parseDuration("  ")).toBeNull();
  });

  it.each([
    "soon",
    "1h 2h",
    "1h 30",
    "-1h",
    "P1M",
    "P1Y",
    "PT",
    "P",
    "1:75",
    "1x",
  ])("rejects %s", (text) => {
    expect(parseDuration(text)).toBeUndefined();
  });
});

describe("formatISODuration", () => {
  it.each([
    [90 * MINUTE, "PT1H30M"],
    [0, "PT0S"],
    [26 * HOUR, "P1DT2H"],
    [1500, "PT1.5S"],
  ])("writes %d ms as %s", (total, iso) => {
    expect(formatISODuration(total)).toBe(iso);
    expect(parseDuration(iso)).toBe(total);
  });
});

describe("formatCompactDuration", () => {
  it("writes the syntax parseDuration reads, without zero units", () => {
    expect(formatCompactDuration(90 * MINUTE, hms)).toBe("1h 30m");
    expect(formatCompactDuration(HOUR + 5000, hms)).toBe("1h 5s");
    expect(formatCompactDuration(0, hms)).toBe("0s");
    expect(formatCompactDuration(0, unitRange("hour", "minute"))).toBe("0m");
  });
});

describe("formatDuration", () => {
  const intl = Intl as unknown as { DurationFormat?: unknown };
  const native = intl.DurationFormat;
  afterEach(() => {
    intl.DurationFormat = native;
  });

  it("writes the duration in words", () => {
    expect(formatDuration(90 * MINUTE, hms)).toBe("1 hour, 30 minutes");
    expect(formatDuration(0, hms)).toBe("0 seconds");
  });

  it("falls back to NumberFormat units and ListFormat", () => {
    intl.DurationFormat = undefined;

    expect(formatDuration(90 * MINUTE, hms)).toBe("1 hour, 30 minutes");
    expect(formatDuration(90 * MINUTE, hms, { locale: "de" })).toBe(
      "1 Stunde, 30 Minuten",
    );
    expect(formatDuration(0, hms, { style: "short" })).toBe("0 sec");
  });

  it("agrees with Intl.DurationFormat on the fallback in other locales", () => {
    const withNative = formatDuration(HOUR + 5 * MINUTE, hms, {
      locale: "fr",
    });
    intl.DurationFormat = undefined;
    expect(formatDuration(HOUR + 5 * MINUTE, hms, { locale: "fr" })).toBe(
      withNative,
    );
  });
});

describe("unitLabel", () => {
  it("is the unit in the locale", () => {
    expect(unitLabel("hour", "en", "narrow")).toBe("h");
    expect(unitLabel("minute", "de", "narrow")).toBe("Min.");
    expect(unitLabel("minute", "de", "long")).toBe("Minuten");
    expect(unitLabel("hour", "en", "long")).toBe("hours");
  });
});
