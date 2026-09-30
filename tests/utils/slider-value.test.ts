import {
  formatRangeLabel,
  getClientX,
  getClientY,
  getPointerPosition,
  getTrackAxis,
  getValueText,
  snapToStep,
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

  it.each([
    { formatValue: undefined, value: 68, expected: "Comfortable" },
    {
      formatValue: (v: number) => `${v}°F`,
      value: 68,
      expected: "68°F, Comfortable",
    },
    { formatValue: (v: number) => `${v}%`, value: 50, expected: "50%" },
    { formatValue: undefined, value: 70, expected: undefined },
    { formatValue: (v: number) => `${v}°F`, value: 70, expected: "70°F" },
  ])(
    "announces a mark label at $value → $expected",
    ({ formatValue, value, expected }) => {
      const markLabels = new Map([
        [68, "Comfortable"],
        [50, "50%"],
      ]);
      expect(getValueText(value, formatValue, markLabels)).toBe(expected);
    },
  );
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

  it("does not leak floating-point noise with a decimal step", () => {
    expect(
      valueFromTrackPosition({
        clientX: 30,
        left: 0,
        width: 100,
        min: 0,
        max: 1,
        step: 0.1,
      }),
    ).toBe(0.3);
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
  it("reads the coordinate along the slider axis", () => {
    const event = { clientX: 10, clientY: 20 } as MouseEvent;
    expect(getPointerPosition(event, "horizontal")).toBe(10);
    expect(getPointerPosition(event, "vertical")).toBe(20);
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

  it("starts at the bottom edge with a negative length when vertical", () => {
    expect(getTrackAxis(rect, "vertical")).toEqual({
      start: 300,
      length: -100,
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
