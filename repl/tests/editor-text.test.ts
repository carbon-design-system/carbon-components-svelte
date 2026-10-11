import { describe, expect, test } from "bun:test";
import {
  commentContext,
  indent,
  lineAt,
  lineStarts,
  newline,
  outdent,
  toggleComment,
} from "../src/editor/text.js";

type Edit = {
  from: number;
  to: number;
  insert: string;
  selectionStart: number;
  selectionEnd: number;
};

/** Apply an Edit and render the selection as [ ] markers. */
function run(op: (v: string, s: number, e: number) => Edit, input: string) {
  const s = input.indexOf("[");
  const e = input.indexOf("]") - 1;
  const value = input.replace("[", "").replace("]", "");
  const edit = op(value, s, e);
  const out = value.slice(0, edit.from) + edit.insert + value.slice(edit.to);
  return `${out.slice(0, edit.selectionStart)}[${out.slice(edit.selectionStart, edit.selectionEnd)}]${out.slice(edit.selectionEnd)}`;
}

test("lineStarts / lineAt", () => {
  const starts = lineStarts("a\nbc\n\nd");
  expect(starts).toEqual([0, 2, 5, 6]);
  expect(lineAt(starts, 0)).toBe(0);
  expect(lineAt(starts, 3)).toBe(1);
  expect(lineAt(starts, 5)).toBe(2);
  expect(lineAt(starts, 7)).toBe(3);
});

describe("indent / outdent", () => {
  test("Tab inserts an indent at the caret", () => {
    expect(run(indent, "a[]b")).toBe("a  []b");
  });

  test("Tab indents every selected line, skipping blank ones", () => {
    expect(run(indent, "[x\n\ny]\nz")).toBe("[  x\n\n  y]\nz");
  });

  test("a selection ending at column 0 leaves that line alone", () => {
    expect(run(indent, "[a\n]b")).toBe("[  a]\nb");
  });

  test("Shift+Tab outdents lines and keeps a collapsed caret in place", () => {
    expect(run(outdent, "    a[]b")).toBe("  a[]b");
    expect(run(outdent, "[  a\n    b]")).toBe("[a\n  b]");
  });
});

describe("newline", () => {
  test("keeps the indent", () => {
    expect(run(newline, "  a[]")).toBe("  a\n  []");
  });

  test("indents after an opener and splits a bracket pair", () => {
    expect(run(newline, "if (x) {[]}")).toBe("if (x) {\n  []\n}");
    expect(run(newline, "  call([]")).toBe("  call(\n    []");
  });

  test("splits an open/close tag pair but not after a self-closing tag", () => {
    expect(run(newline, "<div>[]</div>")).toBe("<div>\n  []\n</div>");
    expect(run(newline, "<Button />[]")).toBe("<Button />\n[]");
  });
});

describe("toggleComment", () => {
  test("context comes from the enclosing script/style block", () => {
    const svelte =
      "<script>\nlet a;\n</script>\n<style>\np {}\n</style>\n<p>x</p>";
    expect(commentContext(svelte, svelte.indexOf("let"), "svelte")).toBe("js");
    expect(commentContext(svelte, svelte.indexOf("p {"), "svelte")).toBe("css");
    expect(commentContext(svelte, svelte.indexOf("<p>"), "svelte")).toBe(
      "markup",
    );
  });

  test("JS lines toggle `// ` at the shared indent", () => {
    const on = run((v, s, e) => toggleComment(v, s, e, "js"), "  [a\n    b]");
    expect(on).toBe("[  // a\n  //   b]");
    const off = run((v, s, e) => toggleComment(v, s, e, "js"), on);
    expect(off).toBe("[  a\n    b]");
  });

  test("markup wraps the lines in a block comment and unwraps it", () => {
    const on = run(
      (v, s, e) => toggleComment(v, s, e, "svelte"),
      "  <p>[x]</p>",
    );
    expect(on).toBe("[  <!-- <p>x</p> -->]");
    expect(run((v, s, e) => toggleComment(v, s, e, "svelte"), on)).toBe(
      "[  <p>x</p>]",
    );
  });
});
