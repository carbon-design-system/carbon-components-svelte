import {
  buildRows,
  copyDiffText,
  defaultLinesDescription,
  parseLineRanges,
  splitLines,
  toRuns,
} from "../../src/CodeSnippet/code-lines.js";

describe("parseLineRanges", () => {
  it("reads lines and ranges, and skips what is not one", () => {
    expect([...parseLineRanges("2, 4-6,x,7-", 10)]).toEqual([2, 4, 5, 6]);
  });

  it("drops lines past the end and reads a backward range", () => {
    expect([...parseLineRanges("3-1,8-99", 9)]).toEqual([1, 2, 3, 8, 9]);
  });

  it("is empty without a list", () => {
    expect(parseLineRanges(undefined, 5).size).toBe(0);
  });
});

describe("toRuns", () => {
  it("joins neighbors into runs", () => {
    expect(toRuns([6, 2, 4, 5, 3, 9])).toEqual([
      [2, 6],
      [9, 9],
    ]);
  });
});

describe("defaultLinesDescription", () => {
  it("says line for one line and lines for more", () => {
    expect(defaultLinesDescription("added", [[3, 3]])).toBe("Line 3 added.");
    expect(
      defaultLinesDescription("highlighted", [
        [2, 2],
        [4, 6],
      ]),
    ).toBe("Lines 2, 4 to 6 highlighted.");
  });
});

describe("splitLines", () => {
  it("keeps each line's break, so the lines join back to the code", () => {
    for (const code of ["a\n\nc", "a\nb\n", "", "\n", "a"]) {
      expect(splitLines(code).join("")).toBe(code);
    }
  });

  it("ends the last line with a trailing break instead of adding one", () => {
    expect(splitLines("a\nb\n")).toEqual(["a\n", "b\n"]);
  });
});

describe("buildRows", () => {
  const options = { diff: false, numbers: true, start: 1, highlight: "" };

  it("pads numbers to the widest, and starts where it is told", () => {
    const code = Array.from({ length: 3 }, (_, i) => `l${i}`).join("\n");
    const { rows } = buildRows(code, { ...options, start: 9 });
    expect(rows.map((row) => row.gutter)).toEqual(["  9  ", " 10  ", " 11  "]);
  });

  it("draws the first column of a diff as a marker, not as text", () => {
    const { rows, runs } = buildRows(" a\n-b\n+c", {
      ...options,
      diff: true,
      numbers: false,
    });
    expect(rows.map((row) => [row.text, row.gutter, row.change])).toEqual([
      ["a", "    ", undefined],
      ["b", " -  ", "removed"],
      ["c", " +  ", "added"],
    ]);
    expect(runs.removed).toEqual([[2, 2]]);
    expect(runs.added).toEqual([[3, 3]]);
  });

  it("reports highlighted runs, within the code", () => {
    const { rows, runs } = buildRows("a\nb\nc", {
      ...options,
      numbers: false,
      highlight: "2-9",
    });
    expect(rows.map((row) => row.highlighted)).toEqual([false, true, true]);
    expect(runs.highlighted).toEqual([[2, 3]]);
  });
});

describe("copyDiffText", () => {
  const diff = " a\n-b\n+c\n d\n";

  it("copies a diff as written", () => {
    expect(copyDiffText(diff, "diff")).toBe(diff);
  });

  it("copies the result: no removed lines, no marker column", () => {
    expect(copyDiffText(diff, "result")).toBe("a\nc\nd\n");
  });

  it("does not end the result on a break the code did not", () => {
    expect(copyDiffText(" a\n-b", "result")).toBe("a");
  });
});
