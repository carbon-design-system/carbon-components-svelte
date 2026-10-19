import {
  formatRangeLabel,
  getPointerPosition,
  getTrackAxis,
  getValueText,
  valueFromPointer,
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
    expect(formatRangeLabel("10 MB", 10, (value) => `${value}!`)).toBe("10 MB");
  });

  it("falls back to formatValue when label is empty", () => {
    expect(formatRangeLabel("", 10, (value) => `${value} MB`)).toBe("10 MB");
  });

  it("falls back to the raw numeric value when label and formatValue are both unset", () => {
    expect(formatRangeLabel("", 0, undefined)).toBe(0);
  });
});

describe("valueFromTrackPosition", () => {
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

describe("getPointerPosition", () => {
  const mouse = { clientX: 10, clientY: 20 } as MouseEvent;
  const touch = (point?: { clientX: number; clientY: number }) =>
    ({ touches: point ? [point] : [] }) as unknown as TouchEvent;
  const point = { clientX: 24, clientY: 42 };

  it.each([
    ["horizontal", mouse, 10],
    ["vertical", mouse, 20],
    ["horizontal", touch(point), 24],
    ["vertical", touch(point), 42],
    ["horizontal", touch(), null],
    ["vertical", touch(), null],
  ] as const)("%s %o -> %o", (orientation, event, expected) => {
    expect(getPointerPosition(event, orientation)).toBe(expected);
  });
});

describe("getTrackAxis", () => {
  const rect = { left: 10, width: 200, bottom: 300, height: 100 };

  it("starts at the left edge when horizontal", () => {
    expect(getTrackAxis(rect, "horizontal")).toEqual({
      start: 10,
      length: 200,
    });
  });
});

describe("valueFromPointer", () => {
  const rect = { left: 0, width: 200, bottom: 200, height: 200 };
  const options = { min: 0, max: 100, step: 1 };

  it("maps a horizontal pointer left to right", () => {
    const event = { clientX: 50, clientY: 0 } as MouseEvent;
    expect(
      valueFromPointer(event, rect, { ...options, orientation: "horizontal" }),
    ).toBe(25);
  });

  it("maps a vertical pointer bottom to top", () => {
    const event = { clientX: 0, clientY: 50 } as MouseEvent;
    expect(
      valueFromPointer(event, rect, { ...options, orientation: "vertical" }),
    ).toBe(75);
  });

  it("subtracts the offset from the pointer position", () => {
    const event = { clientX: 58, clientY: 0 } as MouseEvent;
    expect(
      valueFromPointer(event, rect, {
        ...options,
        orientation: "horizontal",
        offset: 8,
      }),
    ).toBe(25);
  });

  it("returns null for a touch event with no active touch point", () => {
    const event = { touches: [] } as unknown as TouchEvent;
    expect(
      valueFromPointer(event, rect, { ...options, orientation: "vertical" }),
    ).toBeNull();
  });
});
