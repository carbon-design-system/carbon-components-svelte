// @vitest-environment node
import {
  continueList,
  indentList,
  isInsideFence,
  type MarkdownAction,
  type MarkdownEdit,
  markdownEdit,
} from "../../src/utils/markdown-edit.js";

// The selection is written ‹like this›; a caret is ‹›.
function parse(spec: string) {
  const start = spec.indexOf("‹");
  const end = spec.indexOf("›") - 1;
  const text = spec.replace("‹", "").replace("›", "");
  return { text, start, end };
}

function show(text: string, edit: MarkdownEdit | null) {
  assert(edit);
  const next = text.slice(0, edit.from) + edit.insert + text.slice(edit.to);
  return `${next.slice(0, edit.start)}‹${next.slice(edit.start, edit.end)}›${next.slice(edit.end)}`;
}

function act(action: MarkdownAction, spec: string, level?: number) {
  const { text, start, end } = parse(spec);
  return show(
    text,
    markdownEdit(action, text, start, end, { headingLevel: level }),
  );
}

function enter(spec: string) {
  const { text, start, end } = parse(spec);
  const edit = continueList(text, start, end);
  return edit ? show(text, edit) : null;
}

function tab(spec: string, outdent = false) {
  const { text, start, end } = parse(spec);
  const edit = indentList(text, start, end, outdent);
  return edit ? show(text, edit) : null;
}

describe("inline actions", () => {
  it("wraps the selection and keeps it selected", () => {
    expect(act("bold", "a ‹word› b")).toBe("a **‹word›** b");
    expect(act("italic", "a ‹word› b")).toBe("a *‹word›* b");
    expect(act("strikethrough", "a ‹word› b")).toBe("a ~~‹word›~~ b");
  });

  it("wraps the word at a caret, and pairs markers between words", () => {
    expect(act("bold", "a wo‹›rd b")).toBe("a **‹word›** b");
    expect(act("bold", "a ‹› b")).toBe("a **‹›** b");
  });

  it("leaves spaces outside the markers", () => {
    expect(act("bold", "a‹ word ›b")).toBe("a **‹word›** b");
  });

  it("takes markers off, around or inside the selection", () => {
    expect(act("bold", "**‹word›**")).toBe("‹word›");
    expect(act("bold", "‹**word**›")).toBe("‹word›");
  });

  it("keeps bold and italic apart on the shared asterisk", () => {
    expect(act("italic", "**‹word›**")).toBe("***‹word›***");
    expect(act("bold", "*‹word›*")).toBe("***‹word›***");
    expect(act("italic", "***‹word›***")).toBe("**‹word›**");
    expect(act("bold", "***‹word›***")).toBe("*‹word›*");
  });

  it("wraps each line of a multi-line selection so every one formats", () => {
    expect(act("bold", "‹a\nb›")).toBe("‹**a**\n**b**›");
  });

  it("makes inline code, with a fence longer than any backtick inside", () => {
    expect(act("code", "‹x›")).toBe("`‹x›`");
    expect(act("code", "`‹x›`")).toBe("‹x›");
    expect(act("code", "‹a`b›")).toBe("``‹a`b›``");
  });

  it("fences a multi-line selection and unfences it again", () => {
    expect(act("code", "‹a\nb›")).toBe("```\n‹a\nb›\n```");
    expect(act("code", "```\n‹a\nb›\n```")).toBe("‹a\nb›");
  });
});

describe("links", () => {
  it("selects the address to type over", () => {
    expect(act("link", "see ‹docs›")).toBe("see [docs](‹url›)");
  });

  it("puts the caret in the text when an address is selected", () => {
    expect(act("link", "‹https://a.test/x›")).toBe("[‹›](https://a.test/x)");
  });

  it("turns a link back into its text", () => {
    expect(act("link", "‹[docs](https://a.test)›")).toBe("‹docs›");
  });

  it("escapes brackets in the text, and leaves an escape already there", () => {
    expect(act("link", "‹a]b›")).toBe("[a\\]b](‹url›)");
    expect(act("link", "‹a\\]b›")).toBe("[a\\]b](‹url›)");
    expect(act("link", "‹a\\\\]b›")).toBe("[a\\\\\\]b](‹url›)");
  });
});

describe("line actions", () => {
  it("prefixes every selected line and removes the prefix again", () => {
    expect(act("quote", "‹a\nb›")).toBe("‹> a\n> b›");
    expect(act("quote", "‹> a\n> b›")).toBe("‹a\nb›");
    expect(act("ul", "‹a\n\nb›")).toBe("‹- a\n\n- b›");
  });

  it("numbers an ordered list", () => {
    expect(act("ol", "‹a\nb\nc›")).toBe("‹1. a\n2. b\n3. c›");
  });

  it("swaps one list kind for another instead of stacking markers", () => {
    expect(act("ol", "‹- a\n- b›")).toBe("‹1. a\n2. b›");
    expect(act("task", "‹- a›")).toBe("‹- [ ] a›");
    expect(act("ul", "‹- [ ] a›")).toBe("‹- a›");
  });

  it("keeps the caret on its text", () => {
    expect(act("ul", "ab‹›c")).toBe("- ab‹›c");
    expect(act("ul", "- ab‹›c")).toBe("ab‹›c");
  });

  it("makes a heading of the level, toggles it, and changes its level", () => {
    expect(act("heading", "ti‹›tle")).toBe("### ti‹›tle");
    expect(act("heading", "### ti‹›tle")).toBe("ti‹›tle");
    expect(act("heading", "# ti‹›tle", 2)).toBe("## ti‹›tle");
  });

  it("does nothing to a line inside a code fence", () => {
    const { text, start, end } = parse("```\n‹a›\n```");
    expect(markdownEdit("quote", text, start, end)).toBeNull();
  });
});

describe("Enter", () => {
  it("starts the next item with the same marker", () => {
    expect(enter("- a‹›")).toBe("- a\n- ‹›");
    expect(enter("* a‹›")).toBe("* a\n* ‹›");
    expect(enter("  - a‹›")).toBe("  - a\n  - ‹›");
  });

  it("counts up in a numbered list and opens an empty task box", () => {
    expect(enter("9. a‹›")).toBe("9. a\n10. ‹›");
    expect(enter("- [x] a‹›")).toBe("- [x] a\n- [ ] ‹›");
  });

  it("carries the text after the caret to the new item", () => {
    expect(enter("- a‹›b")).toBe("- a\n- ‹›b");
  });

  it("ends the list on an empty item, and moves a nested one out", () => {
    expect(enter("- a\n- ‹›")).toBe("- a\n‹›");
    expect(enter("- a\n  - ‹›")).toBe("- a\n- ‹›");
  });

  it("continues and ends a quote", () => {
    expect(enter("> a‹›")).toBe("> a\n> ‹›");
    expect(enter("> a\n> ‹›")).toBe("> a\n‹›");
  });

  it("leaves other lines, selections, markers and code fences alone", () => {
    expect(enter("plain‹›")).toBeNull();
    expect(enter("‹- a›")).toBeNull();
    expect(enter("‹›- a")).toBeNull();
    expect(enter("```\n- a‹›\n```")).toBeNull();
  });
});

describe("Tab", () => {
  it("nests an item under the one above and moves it out again", () => {
    expect(tab("- a\n- ‹›b")).toBe("- a\n  - ‹›b");
    expect(tab("1. a\n1. ‹›b")).toBe("1. a\n   1. ‹›b");
    expect(tab("- a\n  - ‹›b", true)).toBe("- a\n- ‹›b");
  });

  it("moves every selected item together", () => {
    expect(tab("- a\n‹- b\n- c›")).toBe("- a\n‹  - b\n  - c›");
  });

  it("stays put when the item cannot move", () => {
    expect(tab("- ‹›a")).toBe("- ‹›a");
    expect(tab("- ‹›a", true)).toBe("- ‹›a");
  });

  it("returns null off a list, so Tab keeps moving focus", () => {
    expect(tab("plain‹›")).toBeNull();
    expect(tab("```\n- a‹›\n```")).toBeNull();
  });
});

describe("isInsideFence", () => {
  it("knows an open fence from a closed one", () => {
    expect(isInsideFence("```\na", 5)).toBe(true);
    expect(isInsideFence("```\na\n```\nb", 11)).toBe(false);
    expect(isInsideFence("~~~\na", 5)).toBe(true);
  });
});
