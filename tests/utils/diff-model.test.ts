// @vitest-environment node
import {
  buildRows,
  type DiffLine,
  diffLines,
  formatHunkHeader,
  formatUnifiedDiff,
  highlightLines,
  inlineRanges,
  lineSegments,
  patchLines,
  splitLines,
  tokensByLine,
} from "../../src/utils/diff-model.js";
import { parseUnifiedDiff } from "../../src/utils/unified-diff.js";

const numbered = (count: number, edit: Record<number, string> = {}) =>
  Array.from({ length: count }, (_, i) => edit[i + 1] ?? `line ${i + 1}`).join(
    "\n",
  );

describe("splitLines", () => {
  it("drops the empty line a final newline opens", () => {
    expect(splitLines("a\nb\n")).toEqual(["a", "b"]);
    expect(splitLines("a\r\nb")).toEqual(["a", "b"]);
    expect(splitLines("")).toEqual([]);
    expect(splitLines("\n")).toEqual([""]);
  });
});

describe("diffLines", () => {
  it("lists removed lines before added ones with both line numbers", () => {
    const { lines, stats } = diffLines("a\nb\nc", "a\nB\nB2\nc");
    expect(
      lines.map((l) => [l.type, l.text, l.oldNo, l.newNo, l.change]),
    ).toEqual([
      ["equal", "a", 1, 1, -1],
      ["delete", "b", 2, 0, 0],
      ["insert", "B", 0, 2, 0],
      ["insert", "B2", 0, 3, 0],
      ["equal", "c", 3, 4, -1],
    ]);
    expect(stats).toEqual({ added: 2, removed: 1, changes: 1 });
  });

  it("pairs the first removed line with the first added one", () => {
    const { lines } = diffLines("a\nb\nc", "a\nB\nB2\nc");
    expect(lines[1].pair).toBe(lines[2]);
    expect(lines[2].pair).toBe(lines[1]);
    expect(lines[3].pair).toBeNull();
  });

  it("shows the new text of lines that differ only in ignored whitespace", () => {
    const { lines, stats } = diffLines("  a\nb", "a\nc", {
      ignoreWhitespace: true,
    });
    expect(lines[0]).toMatchObject({ type: "equal", text: "a" });
    expect(stats.changes).toBe(1);
  });
});

describe("buildRows", () => {
  const { lines } = diffLines(
    numbered(30),
    numbered(30, { 3: "three", 20: "twenty" }),
  );

  it("folds unchanged stretches beyond the context", () => {
    const { rows } = buildRows(lines, { view: "unified", context: 3 });
    const text = rows.map((row) =>
      row.type === "hunk"
        ? `${row.header}|${row.hidden}`
        : (row as DiffLine).text,
    );
    expect(text).toEqual([
      "@@ -1,6 +1,6 @@|0",
      "line 1",
      "line 2",
      "line 3",
      "three",
      "line 4",
      "line 5",
      "line 6",
      "@@ -17,7 +17,7 @@|10",
      "line 17",
      "line 18",
      "line 19",
      "line 20",
      "twenty",
      "line 21",
      "line 22",
      "line 23",
      "|7",
    ]);
  });

  it("puts a trailing fold row after the last line", () => {
    const { rows } = buildRows(lines, { view: "unified", context: 3 });
    const last = rows[rows.length - 1];
    expect(last).toMatchObject({ type: "hunk", hidden: 7, trailing: true });
  });

  it("opens a fold by its id", () => {
    const folded = buildRows(lines, { view: "unified", context: 3 });
    const fold = folded.rows.find(
      (row) => row.type === "hunk" && row.hidden === 10,
    );
    const opened = buildRows(lines, {
      view: "unified",
      context: 3,
      expanded: new Set([fold && fold.type === "hunk" ? fold.id : -1]),
    });
    expect(opened.rows.length).toBe(folded.rows.length - 1 + 10);
    expect(opened.rows.filter((row) => row.type === "hunk")).toHaveLength(2);
  });

  it("shows every line when context is Infinity", () => {
    const { rows } = buildRows(lines, {
      view: "unified",
      context: Number.POSITIVE_INFINITY,
      hunkHeaders: false,
    });
    expect(rows).toHaveLength(lines.length);
    expect(rows.every((row) => row.type !== "hunk")).toBe(true);
  });

  it("leaves a one line gap unfolded", () => {
    const text = numbered(12, { 1: "x", 9: "y" });
    const { rows } = buildRows(diffLines(numbered(12), text).lines, {
      view: "unified",
      context: 3,
    });
    expect(rows.filter((row) => row.type === "hunk")).toHaveLength(1);
  });

  it("pairs removed and added lines side by side", () => {
    const { rows } = buildRows(
      diffLines("a\nb\nc\nd", "a\nB\nB2\nB3\nd").lines,
      { view: "split", context: 3, hunkHeaders: false },
    );
    const cells = rows.map((row) =>
      row.type === "pair"
        ? `${row.left?.text ?? "-"}|${row.right?.text ?? "-"}`
        : row.type,
    );
    expect(cells).toEqual(["a|a", "b|B", "c|B2", "-|B3", "d|d"]);
  });

  it("lists where each changed block starts, the same in both views", () => {
    const options = { context: 1, hunkHeaders: true } as const;
    const unified = buildRows(lines, { view: "unified", ...options });
    const split = buildRows(lines, { view: "split", ...options });
    expect(unified.changes).toHaveLength(2);
    expect(split.changes).toHaveLength(2);
    expect(unified.rows[unified.changes[1]]).toMatchObject({ change: 1 });
    expect(split.rows[split.changes[1]]).toMatchObject({ change: 1 });
  });

  it("writes git's header for an empty side", () => {
    expect(formatHunkHeader(1, 0, 1, 3)).toBe("@@ -0,0 +1,3 @@");
    expect(formatHunkHeader(5, 1, 5, 2, "fn")).toBe("@@ -5 +5,2 @@ fn");
    const added = diffLines("", "a\nb");
    expect(buildRows(added.lines, { view: "unified" }).rows[0]).toMatchObject({
      header: "@@ -0,0 +1,2 @@",
    });
  });
});

describe("patch lines", () => {
  const patch = `--- a/f.js
+++ b/f.js
@@ -10,3 +10,3 @@ function a() {
 ten
-eleven
+ELEVEN
 twelve
@@ -40,3 +40,4 @@ function b() {
 forty
+forty and a bit
 forty-one
 forty-two
`;
  const [file] = parseUnifiedDiff(patch);
  const { lines, stats } = patchLines(file);

  it("numbers lines from each hunk start and counts the lines left out", () => {
    expect(stats).toEqual({ added: 2, removed: 1, changes: 2 });
    const gaps = lines.filter((line) => line.type === "gap");
    expect(gaps.map((gap) => [gap.oldNo, gap.hidden])).toEqual([
      [10, 9],
      [40, 27],
    ]);
    expect(lines.find((l) => l.text === "forty and a bit")).toMatchObject({
      newNo: 41,
      oldNo: 0,
    });
  });

  it("writes the header of each hunk as the patch has it", () => {
    const { rows } = buildRows(lines, { view: "unified" });
    const headers = rows.filter((row) => row.type === "hunk");
    expect(
      headers.map((row) => (row.type === "hunk" ? row.header : "")),
    ).toEqual([
      "@@ -10,3 +10,3 @@ function a() {",
      "@@ -40,3 +40,4 @@ function b() {",
    ]);
    expect(headers.map((row) => (row.type === "hunk" ? row.id : 0))).toEqual([
      -1, -1,
    ]);
  });
});

describe("formatUnifiedDiff", () => {
  it("writes a patch that parses back to the same lines", () => {
    const { lines } = diffLines(
      numbered(30),
      numbered(30, { 3: "three", 20: "twenty" }),
    );
    const text = formatUnifiedDiff(lines, {
      oldPath: "a.txt",
      newPath: "b.txt",
    });
    expect(text.startsWith("--- a.txt\n+++ b.txt\n@@ -1,6 +1,6 @@\n")).toBe(
      true,
    );
    const [file] = parseUnifiedDiff(text);
    expect(file.hunks).toHaveLength(2);
    const again = patchLines(file);
    expect(again.stats).toEqual({ added: 2, removed: 2, changes: 2 });
  });

  it("is empty when nothing changed", () => {
    expect(formatUnifiedDiff(diffLines("a", "a").lines)).toBe("");
  });
});

describe("tokens", () => {
  it("cuts tokens at line breaks", () => {
    const lines = tokensByLine([
      { type: "keyword", text: "let" },
      { type: null, text: " a;\n" },
      { type: "comment", text: "/* x\ny */" },
      { type: null, text: "\n" },
    ]);
    expect(lines.map((line) => line.map((token) => token.text))).toEqual([
      ["let", " a;"],
      ["/* x"],
      ["y */"],
    ]);
    expect(lines[1][0].type).toBe("comment");
    expect(lines[2][0].type).toBe("comment");
  });

  it("tokenizes each side whole and gives removed lines the old side", () => {
    const { lines } = diffLines("a\n/* b\nc */", "a\n/* B\nc */");
    const seen: string[] = [];
    highlightLines(lines, (code) => {
      seen.push(code);
      // Everything between /* and */ is a comment, across lines.
      return code
        .split(/(\/\*[\s\S]*?\*\/)/)
        .filter(Boolean)
        .map((text) => ({
          type: text.startsWith("/*") ? "comment" : null,
          text,
        }));
    });
    expect(seen).toEqual(["a\n/* b\nc */", "a\n/* B\nc */"]);
    expect(lines.map((line) => line.tokens?.[0].type)).toEqual([
      null,
      "comment",
      "comment",
      "comment",
    ]);
    expect(lines[1].tokens?.[0].text).toBe("/* b");
    expect(lines[2].tokens?.[0].text).toBe("/* B");
  });
});

describe("inlineRanges", () => {
  it("marks the changed words on both lines of a pair", () => {
    const { lines } = diffLines("run(fast, 1)", "run(slow, 1)");
    expect(inlineRanges(lines[0])).toEqual([4, 8]);
    expect(inlineRanges(lines[1])).toEqual([4, 8]);
  });

  it("has nothing for a line with no counterpart", () => {
    const { lines } = diffLines("a", "a\nb");
    expect(inlineRanges(lines[1])).toBeNull();
  });
});

describe("lineSegments", () => {
  it("returns the line whole without tokens or marks", () => {
    expect(lineSegments("abc", null, null)).toEqual([
      { text: "abc", type: null, mark: false },
    ]);
  });

  it("joins neighbors that share a type and a mark", () => {
    const segments = lineSegments(
      "a(b)",
      [
        { type: "punctuation", text: "(" },
        { type: "punctuation", text: ")" },
        { type: null, text: "a" },
        { type: null, text: "b" },
      ],
      null,
    );
    expect(segments).toEqual([
      { text: "()", type: "punctuation", mark: false },
      { text: "ab", type: null, mark: false },
    ]);
  });

  it("splits tokens at the edges of marked ranges", () => {
    const segments = lineSegments(
      "const x = 1;",
      [
        { type: "keyword", text: "const" },
        { type: null, text: " x = " },
        { type: "number", text: "1" },
        { type: null, text: ";" },
      ],
      [4, 7, 10, 11],
    );
    expect(segments.map((s) => [s.text, s.type, s.mark])).toEqual([
      ["cons", "keyword", false],
      ["t", "keyword", true],
      [" x", null, true],
      [" = ", null, false],
      ["1", "number", true],
      [";", null, false],
    ]);
  });
});
