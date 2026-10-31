import {
  computePinnedOffsets,
  formatColumnStyle,
  formatPinnedClass,
  resolveColumnOrder,
} from "../../src/DataTable/data-table-utils.js";

describe("resolveColumnOrder", () => {
  it("moves pinned columns to their edge and keeps the order within each", () => {
    const headers = [
      { key: "a" },
      { key: "b", columnPinned: "end" },
      { key: "c", columnPinned: "start" },
      { key: "d" },
      { key: "e", columnPinned: "start" },
      { key: "f", columnPinned: "end" },
    ] as const;

    expect(resolveColumnOrder(headers)).toEqual([2, 4, 0, 3, 1, 5]);
  });

  it("drops hidden columns, pinned or not", () => {
    const headers = [
      { key: "a", columnHidden: true, columnPinned: "start" },
      { key: "b" },
      { key: "c", columnHidden: true },
    ] as const;

    expect(resolveColumnOrder(headers)).toEqual([1]);
  });
});

describe("computePinnedOffsets", () => {
  it("returns null when no column is pinned", () => {
    expect(
      computePinnedOffsets([
        { width: "8rem" },
        { leading: true, width: "2rem" },
      ]),
    ).toBeNull();
  });

  it("sums the declared widths of the pins before each pin", () => {
    const layouts = computePinnedOffsets([
      { pin: "start", width: "8rem" },
      { pin: "start", width: "120px" },
      { pin: "start", width: "6rem" },
      { width: "10rem" },
      { pin: "end", width: "5rem" },
      { pin: "end", width: "4rem" },
    ]);

    expect(layouts?.map((layout) => layout?.offset)).toEqual([
      "0px",
      "8rem",
      "calc(8rem + 120px)",
      undefined,
      "4rem",
      "0px",
    ]);
  });

  it("marks the pin nearest the scrolling area on each side", () => {
    const layouts = computePinnedOffsets([
      { pin: "start", width: "8rem" },
      { pin: "start", width: "8rem" },
      { width: "8rem" },
      { pin: "end", width: "8rem" },
      { pin: "end", width: "8rem" },
    ]);

    expect(layouts?.map((layout) => layout?.edge)).toEqual([
      false,
      true,
      undefined,
      true,
      false,
    ]);
  });

  it("pins leading columns with the start group, not without one", () => {
    const withStart = computePinnedOffsets([
      { leading: true, width: "2.5rem" },
      { leading: true, width: "2.5rem" },
      { pin: "start", width: "8rem" },
      { pin: "end", width: "4rem" },
    ]);
    const endOnly = computePinnedOffsets([
      { leading: true, width: "2.5rem" },
      { width: "8rem" },
      { pin: "end", width: "4rem" },
    ]);

    expect(withStart?.map((layout) => layout?.offset)).toEqual([
      "0px",
      "2.5rem",
      "5rem",
      "0px",
    ]);
    expect(endOnly?.[0]).toBeUndefined();
  });

  it("prefers a measured width, and counts an unmeasurable one as zero", () => {
    const columns = [
      { pin: "start", width: "8rem" },
      { pin: "start", width: "50%" },
      { pin: "start" },
      { pin: "start", width: "1rem" },
    ] as const;

    expect(
      computePinnedOffsets(columns)?.map((layout) => layout?.offset),
    ).toEqual(["0px", "8rem", "8rem", "8rem"]);
    expect(
      computePinnedOffsets(columns, [100.5])?.map((layout) => layout?.offset),
    ).toEqual(["0px", "100.5px", "100.5px", "100.5px"]);
  });
});

describe("pinned cell attributes", () => {
  const pin = { side: "end", offset: "4rem", edge: true } as const;

  it("adds the pin classes after the given ones", () => {
    expect(formatPinnedClass(pin, "bx--table-expand")).toBe(
      "bx--table-expand bx--table-column--pinned-end bx--table-column--pinned-end-edge",
    );
    expect(formatPinnedClass(undefined)).toBeUndefined();
    expect(formatPinnedClass(undefined, "bx--table-expand")).toBe(
      "bx--table-expand",
    );
  });

  it("writes the offset beside the width", () => {
    expect(formatColumnStyle({ width: "8rem" }, pin)).toBe(
      "width: 8rem;--ccs-pinned-offset: 4rem",
    );
    expect(formatColumnStyle({}, pin)).toBe("--ccs-pinned-offset: 4rem");
    expect(formatColumnStyle({ width: "8rem" }, undefined)).toBe("width: 8rem");
  });
});
