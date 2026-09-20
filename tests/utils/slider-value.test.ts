import {
  formatRangeLabel,
  getClientX,
  getValueText,
  valueFromTrackPosition,
} from "../../src/utils/slider-value.js";

describe("getValueText", () => {
  test("returns undefined without a formatValue", () => {
    expect(getValueText(50, undefined)).toBeUndefined();
  });

  test("delegates to formatValue when provided", () => {
    expect(getValueText(50, (value) => `${value}%`)).toBe("50%");
  });
});

describe("formatRangeLabel", () => {
  test("prefers an explicit label", () => {
    expect(formatRangeLabel("10 MB", 10, undefined)).toBe("10 MB");
  });

  test("falls back to formatValue when label is empty", () => {
    expect(formatRangeLabel("", 10, (value) => `${value} MB`)).toBe("10 MB");
  });

  test("falls back to the raw numeric value when label and formatValue are both unset", () => {
    expect(formatRangeLabel("", 0, undefined)).toBe(0);
    expect(formatRangeLabel("", 100, undefined)).toBe(100);
  });
});

describe("getClientX", () => {
  test("reads clientX from a mouse event", () => {
    const event = { clientX: 42 } as MouseEvent;
    expect(getClientX(event)).toBe(42);
  });

  test("reads clientX from the first touch point", () => {
    const event = { touches: [{ clientX: 24 }] } as unknown as TouchEvent;
    expect(getClientX(event)).toBe(24);
  });

  test("returns null for a touch event with no active touch point", () => {
    const event = { touches: [] } as unknown as TouchEvent;
    expect(getClientX(event)).toBeNull();
  });
});

describe("valueFromTrackPosition", () => {
  test("maps the midpoint of the track to the midpoint of the range", () => {
    expect(
      valueFromTrackPosition({
        clientX: 50,
        left: 0,
        width: 100,
        min: 0,
        max: 100,
        step: 1,
      }),
    ).toBe(50);
  });

  test("snaps to step", () => {
    expect(
      valueFromTrackPosition({
        clientX: 24,
        left: 0,
        width: 100,
        min: 0,
        max: 100,
        step: 10,
      }),
    ).toBe(20);
  });

  test("clamps below min", () => {
    expect(
      valueFromTrackPosition({
        clientX: -50,
        left: 0,
        width: 100,
        min: 0,
        max: 100,
        step: 1,
      }),
    ).toBe(0);
  });

  test("clamps above max", () => {
    expect(
      valueFromTrackPosition({
        clientX: 500,
        left: 0,
        width: 100,
        min: 0,
        max: 100,
        step: 1,
      }),
    ).toBe(100);
  });
});
