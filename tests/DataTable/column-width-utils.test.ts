import {
  formatTableWidth,
  leadingColumnLengths,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  parsePixelWidth,
  resolveColumnBounds,
} from "../../src/DataTable/data-table-utils.js";

describe("parsePixelWidth", () => {
  it("reads a number and a px length", () => {
    expect(parsePixelWidth(120)).toBe(120);
    expect(parsePixelWidth("120px")).toBe(120);
    expect(parsePixelWidth(" 96.5px ")).toBe(96.5);
  });

  it("has no pixel width for lengths that depend on layout", () => {
    expect(parsePixelWidth("10rem")).toBeUndefined();
    expect(parsePixelWidth("50%")).toBeUndefined();
    expect(parsePixelWidth("auto")).toBeUndefined();
    expect(parsePixelWidth(undefined)).toBeUndefined();
    expect(parsePixelWidth(Number.NaN)).toBeUndefined();
  });
});

describe("resolveColumnBounds", () => {
  it("floors the minimum and defaults the maximum", () => {
    expect(resolveColumnBounds({})).toEqual({
      min: MIN_COLUMN_WIDTH,
      max: MAX_COLUMN_WIDTH,
    });
    expect(resolveColumnBounds({ minWidth: "10px" }).min).toBe(
      MIN_COLUMN_WIDTH,
    );
  });

  it("takes minWidth and maxWidth in pixels, and lets a larger minimum win", () => {
    expect(resolveColumnBounds({ minWidth: "96px", maxWidth: 240 })).toEqual({
      min: 96,
      max: 240,
    });
    expect(resolveColumnBounds({ minWidth: "300px", maxWidth: 200 })).toEqual({
      min: 300,
      max: 300,
    });
  });
});

describe("formatTableWidth", () => {
  const headers = [{ key: "a" }, { key: "b" }];

  it("sums the column widths, with the leading columns", () => {
    expect(formatTableWidth([], headers, { a: 100, b: 50 })).toBe("150px");
    expect(
      formatTableWidth(leadingColumnLengths(false, true, true), headers, {
        a: 100,
        b: 50,
      }),
    ).toBe("calc(2.5rem + 2.5rem + 150px)");
  });

  it("has no width until every column has one", () => {
    expect(formatTableWidth([], headers, { a: 100 })).toBeUndefined();
  });
});
