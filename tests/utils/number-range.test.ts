import {
  fromSliderValues,
  isOnStep,
  normalizeRange,
  parseRangeText,
  rangesEqual,
  toSliderValues,
  validateRange,
} from "../../src/utils/number-range.js";
import { parse, parseLocaleValue } from "../../src/utils/numeric-format.js";

describe("normalizeRange", () => {
  it.each([
    [undefined, [null, null]],
    [[], [null, null]],
    [[5], [5, null]],
    [
      [null, 9],
      [null, 9],
    ],
    [
      ["5", "9"],
      [null, null],
    ],
    [
      [Number.NaN, Number.POSITIVE_INFINITY],
      [null, null],
    ],
    [
      [1, 2, 3],
      [1, 2],
    ],
  ])("reads %j as %j", (input, expected) => {
    expect(normalizeRange(input)).toEqual(expected);
  });
});

describe("rangesEqual", () => {
  it("compares both ends, and null to null", () => {
    expect(rangesEqual([1, null], [1, null])).toBe(true);
    expect(rangesEqual([1, null], [1, 2])).toBe(false);
  });
});

describe("isOnStep", () => {
  it.each([
    [0.3, 0.1, 0, true],
    [0.35, 0.1, 0, false],
    [15, 5, 5, true],
    [12, 5, 5, false],
    [7, 0, 0, true],
  ])("%d on a step of %d from %d is %s", (value, step, base, expected) => {
    expect(isOnStep(value, step, base)).toBe(expected);
  });
});

describe("validateRange", () => {
  const issues = (options: Parameters<typeof validateRange>[0]) => {
    const { min, max, valid } = validateRange(options);
    return { min: min?.code ?? null, max: max?.code ?? null, valid };
  };

  it("accepts open ends by default and any ordered pair", () => {
    expect(issues({ value: [null, null] })).toEqual({
      min: null,
      max: null,
      valid: true,
    });
    expect(issues({ value: [10, 250], min: 0, max: 1000 }).valid).toBe(true);
    expect(issues({ value: [10, 10] }).valid).toBe(true);
  });

  it("requires both ends when open ends are off", () => {
    expect(issues({ value: [null, 5], allowOpen: false })).toEqual({
      min: "required",
      max: null,
      valid: false,
    });
  });

  it("can leave out required for a field not yet visited, but stays invalid", () => {
    const result = validateRange({
      value: [null, 5],
      allowOpen: false,
      skipRequired: true,
    });
    expect(result.min).toBeNull();
    expect(result.valid).toBe(false);
  });

  it("flags an end outside the bounds, naming the bound", () => {
    const result = validateRange({ value: [-5, 2000], min: 0, max: 1000 });
    expect(result.min).toEqual({ code: "belowMin", limit: 0 });
    expect(result.max).toEqual({ code: "aboveMax", limit: 1000 });
  });

  it("flags an end between steps counted from min, naming the step below", () => {
    expect(validateRange({ value: [12, 20], min: 5, step: 5 }).min).toEqual({
      code: "step",
      limit: 10,
    });
    expect(validateRange({ value: [0.35, null], step: 0.1 }).min).toEqual({
      code: "step",
      limit: 0.3,
    });
  });

  it("puts a crossed pair on the end edited last", () => {
    const onMax = validateRange({ value: [300, 250], blame: "max" });
    expect(onMax.max).toEqual({ code: "crossed", limit: 300 });
    expect(onMax.min).toBeNull();

    const onMin = validateRange({ value: [300, 250], blame: "min" });
    expect(onMin.min).toEqual({ code: "crossed", limit: 250 });
    expect(onMin.max).toBeNull();
  });

  it("blames the maximum for a crossed pair by default", () => {
    expect(validateRange({ value: [3, 2] }).max?.code).toBe("crossed");
  });

  it("reports an end's own problem before the crossing", () => {
    const result = validateRange({
      value: [5000, 250],
      min: 0,
      max: 1000,
      blame: "min",
    });
    expect(result.min?.code).toBe("aboveMax");
    expect(result.max).toBeNull();
    expect(result.valid).toBe(false);
  });

  it("clears the crossing when either end moves to order the pair", () => {
    expect(validateRange({ value: [300, 250] }).valid).toBe(false);
    expect(validateRange({ value: [200, 250] }).valid).toBe(true);
    expect(validateRange({ value: [300, 400] }).valid).toBe(true);
  });

  it("never changes the value it checks", () => {
    const value = [300, 250];
    validateRange({ value });
    expect(value).toEqual([300, 250]);
  });
});

describe("parseRangeText", () => {
  const en = (text: string) => parseRangeText(text, (t) => parse(t, true));
  const de = (text: string) =>
    parseRangeText(text, (t) => parseLocaleValue(t, ".", ","));

  it.each([
    ["10-250", [10, 250]],
    ["10 - 250", [10, 250]],
    ["10 – 250", [10, 250]],
    ["10—250", [10, 250]],
    ["10 to 250", [10, 250]],
    ["10 TO 250", [10, 250]],
    ["8000..8100", [8000, 8100]],
    ["8000...8100", [8000, 8100]],
    ["  10-250  ", [10, 250]],
    ["1.5-2.5", [1.5, 2.5]],
    ["0.5 – 2", [0.5, 2]],
  ])("splits %j", (text, expected) => {
    expect(en(text)).toEqual(expected);
  });

  it("reads a hyphen as a minus where that is the only split that parses", () => {
    expect(en("-5-10")).toEqual([-5, 10]);
    expect(en("-5--2")).toEqual([-5, -2]);
    expect(en("-5 – -2")).toEqual([-5, -2]);
    expect(en("−5 to −2")).toEqual([-5, -2]);
  });

  it("keeps a crossed paste as pasted, so the error can say so", () => {
    expect(en("250-10")).toEqual([250, 10]);
  });

  it("reads each side in the locale's number format", () => {
    expect(de("1.234,5 - 2.000")).toEqual([1234.5, 2000]);
    expect(de("1,5–2,5")).toEqual([1.5, 2.5]);
  });

  it.each([
    "",
    "  ",
    "10",
    "-10",
    "abc",
    "10-",
    "-250-",
    "a-b",
    "10 to",
    "1-2-3x",
  ])("leaves %j to the field", (text) => {
    expect(en(text)).toBeNull();
  });
});

describe("slider mapping", () => {
  it("rests an open end at its bound", () => {
    expect(toSliderValues([null, null], 0, 100)).toEqual([0, 100]);
    expect(toSliderValues([20, null], 0, 100)).toEqual([20, 100]);
  });

  it("keeps the handles inside the bounds and in order", () => {
    expect(toSliderValues([-5, 500], 0, 100)).toEqual([0, 100]);
    expect(toSliderValues([80, 20], 0, 100)).toEqual([80, 80]);
  });

  it("keeps an open end open when only the other handle moves", () => {
    const shown: [number, number] = [0, 100];
    expect(fromSliderValues([null, null], shown, [0, 70])).toEqual([null, 70]);
    expect(fromSliderValues([null, null], shown, [30, 100])).toEqual([
      30,
      null,
    ]);
  });

  it("takes both handles when both moved", () => {
    expect(fromSliderValues([10, 90], [10, 90], [20, 80])).toEqual([20, 80]);
  });

  it("writes a bound a handle was dragged back to as a number, not open", () => {
    expect(fromSliderValues([40, null], [40, 100], [0, 100])).toEqual([
      0,
      null,
    ]);
  });
});
