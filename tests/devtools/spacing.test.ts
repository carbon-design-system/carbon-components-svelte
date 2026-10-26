import {
  formatPx,
  gaps,
  offScale,
  paddingToken,
  sideTokens,
  spacingToken,
} from "../../src/devtools/spacing.js";

/** A computed-style stand-in with every spacing side at 0px. */
function style(overrides: Record<string, string> = {}) {
  return {
    display: "block",
    rowGap: "normal",
    columnGap: "normal",
    marginTop: "0px",
    marginRight: "0px",
    marginBottom: "0px",
    marginLeft: "0px",
    paddingTop: "0px",
    paddingRight: "0px",
    paddingBottom: "0px",
    paddingLeft: "0px",
    borderTopWidth: "0px",
    borderRightWidth: "0px",
    borderBottomWidth: "0px",
    borderLeftWidth: "0px",
    ...overrides,
  } as unknown as CSSStyleDeclaration;
}

describe("spacingToken", () => {
  test.each([
    [0, "0"],
    [0.4, "0"],
    [1, "hairline"],
    [-1, "hairline"],
    [2, "spacing-01"],
    [8, "spacing-03"],
    [16, "spacing-05"],
    [-16, "spacing-05"],
    [160, "spacing-13"],
    [13, null],
    [15, null],
  ])("%spx is %s", (px, token) => {
    expect(spacingToken(px)).toBe(token);
  });

  test("does not flag 1px border overlaps", () => {
    expect(offScale(style({ marginTop: "-1px", paddingTop: "1px" }))).toEqual(
      [],
    );
  });

  test("follows the root font size", () => {
    expect(spacingToken(20, 20)).toBe("spacing-05");
    expect(spacingToken(16, 20)).toBeNull();
  });

  test("allows half a pixel of rounding", () => {
    expect(spacingToken(16.4)).toBe("spacing-05");
    expect(spacingToken(16.6)).toBeNull();
  });
});

describe("paddingToken", () => {
  test("counts the border when the padding alone is off the scale", () => {
    expect(paddingToken(15, 1)).toEqual({ token: "spacing-05", withBorder: 1 });
  });

  test("keeps an on-scale padding as it is", () => {
    expect(paddingToken(16, 1)).toEqual({ token: "spacing-05", withBorder: 0 });
  });

  test("is off the scale with or without the border", () => {
    expect(paddingToken(13, 1)).toEqual({ token: null, withBorder: 0 });
    expect(paddingToken(15, 0)).toEqual({ token: null, withBorder: 0 });
  });
});

describe("formatPx", () => {
  test("rounds to one decimal", () => {
    expect(formatPx(12.345)).toBe("12.3");
    expect(formatPx(16)).toBe("16");
  });
});

describe("gaps", () => {
  test("reads the gap of a flex or grid container", () => {
    expect(
      gaps(style({ display: "flex", rowGap: "8px", columnGap: "16px" })),
    ).toEqual({ row: 8, column: 16 });
    expect(gaps(style({ display: "inline-grid", rowGap: "4px" }))).toEqual({
      row: 4,
      column: 0,
    });
  });

  test("is null for other boxes and for no gap", () => {
    expect(gaps(style({ rowGap: "8px" }))).toBeNull();
    expect(gaps(style({ display: "flex" }))).toBeNull();
  });
});

describe("offScale", () => {
  test("finds nothing on the scale", () => {
    expect(offScale(style({ marginTop: "16px", paddingLeft: "8px" }))).toEqual(
      [],
    );
  });

  test("lists each off-scale side", () => {
    expect(offScale(style({ marginTop: "13px", paddingRight: "5px" }))).toEqual(
      ["margin-top 13", "padding-right 5"],
    );
  });

  test("skips centering margins and margins past the largest token", () => {
    expect(
      offScale(style({ marginLeft: "137px", marginRight: "137px" })),
    ).toEqual([]);
    expect(offScale(style({ marginBottom: "400px" }))).toEqual([]);
  });

  test("measures padding from the border edge", () => {
    expect(
      offScale(style({ paddingLeft: "15px", borderLeftWidth: "1px" })),
    ).toEqual([]);
  });

  test("reports one gap or the two axes", () => {
    expect(
      offScale(style({ display: "flex", rowGap: "10px", columnGap: "10px" })),
    ).toEqual(["gap 10"]);
    expect(
      offScale(style({ display: "grid", rowGap: "10px", columnGap: "16px" })),
    ).toEqual(["row-gap 10"]);
  });
});

describe("sideTokens", () => {
  test("lists each distinct value once", () => {
    expect(sideTokens([16, 16, 13, 0])).toEqual([
      { value: "16", token: "spacing-05", off: false, withBorder: null },
      { value: "13", token: "off-scale", off: true, withBorder: null },
    ]);
  });

  test("notes a side that fits only with its border", () => {
    expect(sideTokens([0, 15, 0, 15], { borders: [1, 1, 1, 1] })).toEqual([
      { value: "15", token: "spacing-05", off: false, withBorder: "1" },
    ]);
  });

  test("does not flag Carbon's own values", () => {
    expect(sideTokens([13, 0, 0, 0], { carbon: true })).toEqual([
      { value: "13", token: "set by Carbon", off: false, withBorder: null },
    ]);
  });
});
