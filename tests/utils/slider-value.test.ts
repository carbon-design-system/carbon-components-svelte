import {
  formatRangeLabel,
  getPointerPosition,
  getTrackAxis,
  getValueText,
  snapToStep,
  valueFromPointer,
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

describe("snapToStep", () => {
  it.each([
    { value: 0.3, min: 0, max: 1, step: 0.1, expected: 0.3 },
    { value: 0.7, min: 0, max: 1, step: 0.1, expected: 0.7 },
    { value: 3, min: 1, max: 10, step: 2, expected: 3 },
    { value: 4.1, min: 1, max: 10, step: 2, expected: 5 },
    { value: 0.18, min: 0.05, max: 1, step: 0.1, expected: 0.15 },
    { value: 3e-7, min: 0, max: 1e-6, step: 1e-7, expected: 3e-7 },
  ])(
    "snaps $value to $expected (min $min, step $step)",
    ({ value, min, max, step, expected }) => {
      expect(snapToStep(value, { min, max, step })).toBe(expected);
    },
  );

  it("clamps to the bounds", () => {
    expect(snapToStep(-5, { min: 0, max: 10, step: 1 })).toBe(0);
    expect(snapToStep(15, { min: 0, max: 10, step: 1 })).toBe(10);
  });

  it("clamps a step that overshoots max back to max", () => {
    expect(snapToStep(10.6, { min: 0, max: 10, step: 3 })).toBe(10);
  });

  it("only clamps when step is not positive", () => {
    expect(snapToStep(3.3, { min: 0, max: 10, step: 0 })).toBe(3.3);
    expect(snapToStep(-1, { min: 0, max: 10, step: -1 })).toBe(0);
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
  const rect = { left: 10, right: 210, width: 200, bottom: 300, height: 100 };

  it("starts at the left edge when horizontal", () => {
    expect(getTrackAxis(rect, "horizontal")).toEqual({
      start: 10,
      length: 200,
    });
  });

  it("starts at the right edge when horizontal in RTL", () => {
    expect(getTrackAxis(rect, "horizontal", true)).toEqual({
      start: 210,
      length: -200,
    });
  });

  it("ignores RTL when vertical", () => {
    expect(getTrackAxis(rect, "vertical", true)).toEqual({
      start: 300,
      length: -100,
    });
  });
});

describe("valueFromPointer", () => {
  const rect = { left: 0, right: 200, width: 200, bottom: 200, height: 200 };
  const options = { min: 0, max: 100, step: 1 };

  it("maps a horizontal pointer left to right", () => {
    const event = { clientX: 50, clientY: 0 } as MouseEvent;
    expect(
      valueFromPointer(event, rect, { ...options, orientation: "horizontal" }),
    ).toBe(25);
  });

  it("maps a horizontal pointer right to left in RTL", () => {
    const event = { clientX: 50, clientY: 0 } as MouseEvent;
    expect(
      valueFromPointer(event, rect, {
        ...options,
        orientation: "horizontal",
        rtl: true,
      }),
    ).toBe(75);
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

  it.each([
    [
      "snaps to step from a nonzero min",
      48,
      { min: 10, max: 110, step: 10 },
      30,
    ],
    ["clamps below min", -50, options, 0],
    ["clamps above max", 500, options, 100],
  ])("%s", (_, clientX, range, expected) => {
    const event = { clientX, clientY: 0 } as MouseEvent;
    expect(
      valueFromPointer(event, rect, { ...range, orientation: "horizontal" }),
    ).toBe(expected);
  });

  it("returns null for a touch event with no active touch point", () => {
    const event = { touches: [] } as unknown as TouchEvent;
    expect(
      valueFromPointer(event, rect, { ...options, orientation: "vertical" }),
    ).toBeNull();
  });
});
