import {
  formatRangeLabel,
  getClientX,
  getClientY,
  getValueText,
  valueFromTrackPosition,
} from "../../src/utils/slider-value.js";

describe("getValueText", () => {
  it("returns undefined without a formatValue", () => {
    expect(getValueText(50, undefined)).toBeUndefined();
  });

  it("delegates to formatValue when provided", () => {
    expect(getValueText(50, (value) => `${value}%`)).toBe("50%");
  });
});

describe("formatRangeLabel", () => {
  it("prefers an explicit label", () => {
    expect(formatRangeLabel("10 MB", 10, undefined)).toBe("10 MB");
  });

  it("falls back to formatValue when label is empty", () => {
    expect(formatRangeLabel("", 10, (value) => `${value} MB`)).toBe("10 MB");
  });

  it("falls back to the raw numeric value when label and formatValue are both unset", () => {
    expect(formatRangeLabel("", 0, undefined)).toBe(0);
    expect(formatRangeLabel("", 100, undefined)).toBe(100);
  });
});

describe("getClientY", () => {
  it("reads clientY from a mouse event", () => {
    const event = { clientY: 42 } as MouseEvent;
    expect(getClientY(event)).toBe(42);
  });

  it("reads clientY from the first touch point", () => {
    const event = { touches: [{ clientY: 24 }] } as unknown as TouchEvent;
    expect(getClientY(event)).toBe(24);
  });

  it("returns null for a touch event with no active touch point", () => {
    const event = { touches: [] } as unknown as TouchEvent;
    expect(getClientY(event)).toBeNull();
  });
});

describe("getClientX", () => {
  it("reads clientX from a mouse event", () => {
    const event = { clientX: 42 } as MouseEvent;
    expect(getClientX(event)).toBe(42);
  });

  it("reads clientX from the first touch point", () => {
    const event = { touches: [{ clientX: 24 }] } as unknown as TouchEvent;
    expect(getClientX(event)).toBe(24);
  });

  it("returns null for a touch event with no active touch point", () => {
    const event = { touches: [] } as unknown as TouchEvent;
    expect(getClientX(event)).toBeNull();
  });
});

describe("valueFromTrackPosition", () => {
  it("maps the midpoint of the track to the midpoint of the range", () => {
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

  it("snaps to step", () => {
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

  it("clamps below min", () => {
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

  it("clamps above max", () => {
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
