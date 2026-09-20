import {
  contrastTextColor,
  divergingColor,
  sequentialColor,
  sequentialStep,
} from "../../../src/viz/utils/color-scale.js";

function extractStep(varString: string): number {
  const match = varString.match(/-(\d+)\)$/);
  if (!match) throw new Error(`no step found in ${varString}`);
  return Number(match[1]);
}

describe("sequentialColor", () => {
  test("0 maps to step 01", () => {
    expect(sequentialColor(0)).toBe("var(--cds-viz-seq-blue-01)");
  });

  test("1 maps to step 11", () => {
    expect(sequentialColor(1)).toBe("var(--cds-viz-seq-blue-11)");
  });

  test("clamps values above 1 and below 0", () => {
    expect(sequentialColor(2)).toBe(sequentialColor(1));
    expect(sequentialColor(-5)).toBe(sequentialColor(0));
  });

  test("a non-finite t returns 'transparent'", () => {
    expect(sequentialColor(Number.NaN)).toBe("transparent");
  });

  test("accepts a hue param", () => {
    expect(sequentialColor(0, "teal")).toBe("var(--cds-viz-seq-teal-01)");
  });

  test("minStep: 2 makes t=0 map to step 02, and t=1 still map to 11", () => {
    expect(sequentialColor(0, "blue", { minStep: 2 })).toBe(
      "var(--cds-viz-seq-blue-02)",
    );
    expect(sequentialColor(1, "blue", { minStep: 2 })).toBe(
      "var(--cds-viz-seq-blue-11)",
    );
  });
});

describe("sequentialStep", () => {
  test("agrees with the step sequentialColor picks", () => {
    for (const t of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
      expect(sequentialStep(t)).toBe(extractStep(sequentialColor(t)));
    }
  });

  test("agrees with sequentialColor when minStep is set", () => {
    for (const t of [0, 0.3, 0.6, 1]) {
      expect(sequentialStep(t, { minStep: 2 })).toBe(
        extractStep(sequentialColor(t, "blue", { minStep: 2 })),
      );
    }
  });
});

describe("divergingColor", () => {
  test("-1, 0, and 1 map to steps 01, 09, and 17", () => {
    expect(divergingColor(-1)).toBe("var(--cds-viz-div-red-cyan-01)");
    expect(divergingColor(0)).toBe("var(--cds-viz-div-red-cyan-09)");
    expect(divergingColor(1)).toBe("var(--cds-viz-div-red-cyan-17)");
  });

  test("accepts a palette param", () => {
    expect(divergingColor(0, "purple-teal")).toBe(
      "var(--cds-viz-div-purple-teal-09)",
    );
  });

  test("clamps values outside [-1, 1]", () => {
    expect(divergingColor(-5)).toBe(divergingColor(-1));
    expect(divergingColor(5)).toBe(divergingColor(1));
  });

  test("a non-finite t returns 'transparent'", () => {
    expect(divergingColor(Number.NaN)).toBe("transparent");
  });
});

describe("contrastTextColor", () => {
  test("the low half of the ramp uses text-01", () => {
    expect(contrastTextColor(1)).toBe("var(--cds-viz-text-01)");
    expect(contrastTextColor(6)).toBe("var(--cds-viz-text-01)");
  });

  test("the high half of the ramp uses inverse-01", () => {
    expect(contrastTextColor(7)).toBe("var(--cds-viz-inverse-01)");
    expect(contrastTextColor(11)).toBe("var(--cds-viz-inverse-01)");
  });
});
