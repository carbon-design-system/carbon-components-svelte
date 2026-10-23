import {
  brushRange,
  formatRangeLabel,
  getPointerPosition,
  getTrackAxis,
  getValueText,
  isTrackRtl,
  shiftRange,
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

describe("shiftRange", () => {
  const bounds = { min: 0, max: 100, step: 1 };

  it("moves both bounds by delta", () => {
    expect(shiftRange(20, 50, 10, bounds)).toEqual({ lower: 30, upper: 60 });
  });

  it.each([
    { delta: 80, expected: { lower: 70, upper: 100 } },
    { delta: -80, expected: { lower: 0, upper: 30 } },
  ])("stops against the edge for delta $delta", ({ delta, expected }) => {
    expect(shiftRange(20, 50, delta, bounds)).toEqual(expected);
  });

  it("does not leak floating-point noise with a decimal step", () => {
    expect(shiftRange(0.2, 0.5, 0.1, { min: 0, max: 1, step: 0.1 })).toEqual({
      lower: 0.3,
      upper: 0.6,
    });
  });
});

describe("brushRange", () => {
  const bounds = { min: 0, max: 100, minGap: 0 };

  it.each([
    { anchor: 20, point: 60, expected: { lower: 20, upper: 60 } },
    { anchor: 60, point: 20, expected: { lower: 20, upper: 60 } },
    { anchor: 40, point: 40, expected: { lower: 40, upper: 40 } },
  ])("paints $anchor → $point", ({ anchor, point, expected }) => {
    expect(brushRange(anchor, point, bounds)).toEqual(expected);
  });

  it.each([
    { anchor: 40, point: 45, expected: { lower: 40, upper: 50 } },
    { anchor: 40, point: 35, expected: { lower: 30, upper: 40 } },
    { anchor: 95, point: 97, expected: { lower: 90, upper: 100 } },
    { anchor: 5, point: 3, expected: { lower: 0, upper: 10 } },
  ])("grows $anchor → $point to minGap", ({ anchor, point, expected }) => {
    expect(brushRange(anchor, point, { ...bounds, minGap: 10 })).toEqual(
      expected,
    );
  });

  it("does not leak floating-point noise when growing to minGap", () => {
    expect(brushRange(0.2, 0.2, { min: 0, max: 1, minGap: 0.1 })).toEqual({
      lower: 0.2,
      upper: 0.3,
    });
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

describe("isTrackRtl", () => {
  const track = () => {
    const node = document.createElement("div");
    document.body.append(node);
    return node;
  };

  afterEach(() => {
    document.body.replaceChildren();
    document.documentElement.style.removeProperty("direction");
  });

  it.each([
    ["the context", "rtl", null, "", true],
    ["the context over the track", "ltr", "track", "rtl", false],
    ["the track", undefined, "track", "rtl", true],
    ["LTR before mount", undefined, null, "rtl", false],
  ] as const)("follows %s", (_name, context, node, direction, expected) => {
    document.documentElement.style.direction = direction;
    expect(isTrackRtl("horizontal", context, node ? track() : null)).toBe(
      expected,
    );
  });

  it("never runs a vertical track right to left", () => {
    document.documentElement.style.direction = "rtl";
    expect(isTrackRtl("vertical", "rtl", track())).toBe(false);
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
