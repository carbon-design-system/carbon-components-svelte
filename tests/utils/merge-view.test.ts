// @vitest-environment node
import {
  buildSideRows,
  cutTokenLines,
  mapScroll,
  markSegments,
  paintedRows,
} from "../../src/utils/merge-view.js";

describe("cutTokenLines", () => {
  it("splits a token that spans lines and keeps each line's runs", () => {
    expect(
      cutTokenLines([
        { type: "keyword", text: "let" },
        { type: null, text: " x\n" },
        { type: "comment", text: "/* a\nb */" },
        { type: null, text: "\n" },
      ]),
    ).toEqual([
      [
        ["keyword", "let"],
        [null, " x"],
      ],
      [["comment", "/* a"]],
      [["comment", "b */"]],
      [],
    ]);
  });
});

describe("buildSideRows", () => {
  const chunks = [
    { type: "unchanged", base: ["a"], ours: ["a"], theirs: ["a"] },
    { type: "conflict", base: ["b"], ours: ["o1", "o2"], theirs: ["t"] },
    { type: "unchanged", base: ["c"], ours: ["c"], theirs: ["c"] },
  ];

  it("puts a two-row header before each conflict and numbers the side's lines", () => {
    const { rows, starts, longest } = buildSideRows(chunks, "ours");
    expect(rows.map((row) => row.kind)).toEqual([
      "line",
      "head",
      "pad",
      "line",
      "line",
      "line",
    ]);
    expect(
      rows.filter((row) => row.kind === "line").map((row) => row.no),
    ).toEqual([1, 2, 3, 4]);
    expect(starts).toEqual([0, 1, 5, 6]);
    expect(longest).toBe(2);
  });

  it("starts a chunk with no lines on the row the next one starts", () => {
    const { starts } = buildSideRows(
      [{ type: "ours", base: [], ours: [], theirs: [] }, ...chunks.slice(2)],
      "ours",
    );
    expect(starts).toEqual([0, 0, 1]);
  });
});

describe("mapScroll", () => {
  const short = [0, 100, 160, 400];
  const tall = [0, 100, 400, 700];

  it("carries the position inside a chunk by its fraction", () => {
    expect(mapScroll(short, tall, 100)).toBe(100);
    expect(mapScroll(short, tall, 130)).toBe(250);
    expect(mapScroll(tall, short, 250)).toBe(130);
  });

  it("is identity-shaped outside the content and on zero-height chunks", () => {
    expect(mapScroll(short, tall, -5)).toBe(-5);
    expect(mapScroll(short, tall, 410)).toBe(710);
    expect(mapScroll([0, 0, 100], [0, 50, 150], 40)).toBe(90);
  });

  it("maps every chunk start to the other pane's start", () => {
    for (let i = 0; i < short.length; i++) {
      expect(mapScroll(short, tall, short[i])).toBe(tall[i]);
    }
  });
});

describe("paintedRows", () => {
  it("covers the viewport plus overscan, clamped to the rows", () => {
    expect(paintedRows(0, 100, 20, 1000, 4)).toEqual({ from: 0, to: 9 });
    expect(paintedRows(2000, 100, 20, 1000, 4)).toEqual({ from: 96, to: 109 });
    expect(paintedRows(19_900, 100, 20, 1000, 4)).toEqual({
      from: 991,
      to: 1000,
    });
    expect(paintedRows(0, 100, 20, 0)).toEqual({ from: 0, to: 0 });
  });
});

describe("markSegments", () => {
  it("cuts runs at the edges of the marked ranges", () => {
    expect(
      markSegments(
        [
          ["key", "port"],
          [null, ": 8080"],
        ],
        [
          [2, 6],
          [8, 10],
        ],
      ),
    ).toEqual([
      ["key", "po", false],
      ["key", "rt", true],
      [null, ": ", true],
      [null, "80", false],
      [null, "80", true],
    ]);
  });
});
