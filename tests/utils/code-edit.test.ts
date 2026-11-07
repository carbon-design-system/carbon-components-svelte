// @vitest-environment node
import {
  type CodeEdit,
  indentEdit,
  type IndentOptions,
  lineAt,
  lineSegments,
  lineStarts,
  maxColumns,
  newlineEdit,
  paintCovers,
  paintWindow,
  pairBackspaceEdit,
  pairEdit,
} from "../../src/utils/code-edit.js";

const spaces: IndentOptions = { indent: "spaces", tabSize: 2 };
const tabs: IndentOptions = { indent: "tabs", tabSize: 4 };

/**
 * Apply an edit the way the component does and mark the new selection with
 * brackets, so a caret reads `[]`.
 */
function apply(text: string, edit: CodeEdit | null) {
  assert(edit);
  const next = text.slice(0, edit.from) + edit.insert + text.slice(edit.to);
  return `${next.slice(0, edit.start)}[${next.slice(edit.start, edit.end)}]${next.slice(edit.end)}`;
}

describe("lineStarts and lineAt", () => {
  it("indexes lines and finds the line of an offset", () => {
    const starts = lineStarts("ab\n\ncde");
    expect(starts).toEqual([0, 3, 4]);
    expect([0, 2, 3, 4, 7].map((offset) => lineAt(starts, offset))).toEqual([
      0, 0, 1, 2, 2,
    ]);
  });

  it("gives an empty text one line", () => {
    expect(lineStarts("")).toEqual([0]);
  });
});

describe("maxColumns", () => {
  it("counts tabs to the next stop and wide characters twice", () => {
    expect(maxColumns("ab\n\tx\nabcd", 4)).toBe(5);
    expect(maxColumns("a\t", 4)).toBe(4);
    expect(maxColumns("日本語", 2)).toBe(6);
  });
});

describe("indentEdit", () => {
  it("inserts up to the next tab stop at a caret", () => {
    expect(apply("a", indentEdit("a", 1, 1, spaces))).toBe("a []");
    expect(
      apply("abc", indentEdit("abc", 3, 3, { indent: "spaces", tabSize: 4 })),
    ).toBe("abc []");
  });

  it("inserts a tab character in tabs mode", () => {
    expect(apply("a", indentEdit("a", 1, 1, tabs))).toBe("a\t[]");
  });

  it("replaces a selection inside one line", () => {
    expect(apply("foo bar", indentEdit("foo bar", 0, 3, spaces))).toBe(
      "  [] bar",
    );
  });

  it("indents every touched line and keeps the selection on the text", () => {
    const text = "a\n\nb\nc";
    expect(apply(text, indentEdit(text, 0, text.length, spaces))).toBe(
      "[  a\n\n  b\n  c]",
    );
    expect(apply(text, indentEdit(text, 2, 5, spaces))).toBe("a\n[\n  b\n]c");
  });

  it("leaves a last line the selection only reaches the start of", () => {
    const text = "a\nb\nc";
    expect(apply(text, indentEdit(text, 0, 4, spaces))).toBe("[  a\n  b\n]c");
  });

  it("outdents the line at a caret", () => {
    expect(apply("    foo", indentEdit("    foo", 6, 6, spaces, true))).toBe(
      "  fo[]o",
    );
    expect(apply("\tfoo", indentEdit("\tfoo", 2, 2, tabs, true))).toBe("f[]oo");
  });

  it("removes at most tabSize spaces, and reports nothing to outdent", () => {
    const text = " x\n   y";
    expect(apply(text, indentEdit(text, 0, text.length, spaces, true))).toBe(
      "[x\n y]",
    );
    expect(indentEdit("x", 0, 0, spaces, true)).toBeNull();
  });
});

describe("newlineEdit", () => {
  it("keeps the line's indent", () => {
    expect(apply("  foo", newlineEdit("  foo", 5, 5, spaces))).toBe(
      "  foo\n  []",
    );
  });

  it("adds a level after an opening bracket", () => {
    expect(apply("if (x) {", newlineEdit("if (x) {", 8, 8, spaces))).toBe(
      "if (x) {\n  []",
    );
  });

  it("opens the block between a bracket and its closer", () => {
    expect(apply("  fn({})", newlineEdit("  fn({})", 6, 6, spaces))).toBe(
      "  fn({\n    []\n  })",
    );
  });

  it("replaces the selection and indents with tabs", () => {
    expect(apply("\tab cd", newlineEdit("\tab cd", 3, 4, tabs))).toBe(
      "\tab\n\t[]cd",
    );
  });
});

describe("pairEdit", () => {
  it("adds a closer before a boundary and leaves the caret between", () => {
    expect(apply("", pairEdit("", 0, 0, "("))).toBe("([])");
    expect(apply("x ", pairEdit("x ", 2, 2, '"'))).toBe('x "[]"');
  });

  it("does not pair before a word character, or a quote after one", () => {
    expect(pairEdit("foo", 0, 0, "(")).toBeNull();
    expect(pairEdit("don", 3, 3, "'")).toBeNull();
  });

  it("steps over a closer it already holds", () => {
    expect(apply("(a)", pairEdit("(a)", 2, 2, ")"))).toBe("(a)[]");
  });

  it("wraps a selection and keeps it selected", () => {
    expect(apply("foo", pairEdit("foo", 0, 3, "["))).toBe("[[foo]]");
    expect(pairEdit("foo", 0, 3, "x")).toBeNull();
  });

  it("removes an empty pair on backspace", () => {
    expect(apply("a()b", pairBackspaceEdit("a()b", 2, 2))).toBe("a[]b");
    expect(pairBackspaceEdit("a(x)", 2, 2)).toBeNull();
    expect(pairBackspaceEdit("()", 1, 2)).toBeNull();
  });
});

describe("lineSegments", () => {
  const text = "a /* x\ny */ b";
  const tokens = [
    { type: null, text: "a " },
    { type: "comment", text: "/* x\ny */" },
    { type: null, text: " b" },
  ];

  it("cuts a token that spans lines at each break", () => {
    expect(lineSegments(text, lineStarts(text), tokens, 0, 2)).toEqual([
      [null, "a ", "comment", "/* x"],
      ["comment", "y */", null, " b"],
    ]);
  });

  it("returns only the window, starting inside a multi-line token", () => {
    expect(lineSegments(text, lineStarts(text), tokens, 1, 2)).toEqual([
      ["comment", "y */", null, " b"],
    ]);
  });

  it("paints plain lines without tokens", () => {
    const plain = "ab\n\ncd";
    expect(lineSegments(plain, lineStarts(plain), undefined, 0, 3)).toEqual([
      [null, "ab"],
      [],
      [null, "cd"],
    ]);
  });
});

describe("paintWindow and paintCovers", () => {
  const metrics = {
    scrollTop: 400,
    viewport: 200,
    lineHeight: 20,
    paddingTop: 0,
    total: 1000,
    overscan: 5,
  };

  it("paints the view plus overscan, clamped to the text", () => {
    expect(paintWindow(metrics)).toEqual({
      from: 15,
      to: 35,
      visibleFrom: 20,
      visibleTo: 30,
    });
    expect(paintWindow({ ...metrics, scrollTop: 0 })).toMatchObject({
      from: 0,
      to: 15,
    });
    expect(paintWindow({ ...metrics, total: 12 })).toMatchObject({ to: 12 });
  });

  it("repaints only once the view nears the edge of what is painted", () => {
    const painted = { from: 15, to: 35 };
    const view = { visibleFrom: 20, visibleTo: 30 };
    expect(paintCovers(painted, view, 1000, 3)).toBe(true);
    expect(paintCovers(painted, view, 1000, 6)).toBe(false);
    expect(paintCovers({ from: 0, to: 35 }, view, 1000, 6)).toBe(false);
    expect(
      paintCovers(
        { from: 0, to: 35 },
        { visibleFrom: 0, visibleTo: 30 },
        35,
        6,
      ),
    ).toBe(true);
  });
});
