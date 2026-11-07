import {
  createEditing,
  restoreSelection,
  saveSelection,
} from "../../src/RichTextEditor/editing.js";

function setup(html: string) {
  const root = document.createElement("div");
  root.contentEditable = "true";
  root.innerHTML = html;
  document.body.appendChild(root);
  return { root, editing: createEditing(root) };
}

/** The first text node under `selector` whose text contains `text`. */
function textNode(root: Element, text: string): Text {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if ((node as Text).data.includes(text)) return node as Text;
  }
  throw new Error(`no text node with ${text}`);
}

/** Select `text` inside the first text node that contains it. */
function select(root: Element, text: string, within = text) {
  const node = textNode(root, within);
  const start = node.data.indexOf(text);
  window
    .getSelection()
    ?.setBaseAndExtent(node, start, node, start + text.length);
}

function caret(root: Element, text: string, offset: number) {
  const node = textNode(root, text);
  window.getSelection()?.collapse(node, offset);
}

function selectAcross(root: Element, from: string, to: string) {
  const a = textNode(root, from);
  const b = textNode(root, to);
  window.getSelection()?.setBaseAndExtent(a, 0, b, b.data.length);
}

afterEach(() => {
  document.body.innerHTML = "";
  window.getSelection()?.removeAllRanges();
});

describe("selection save and restore", () => {
  it("keeps the same text selected after the DOM is rebuilt", () => {
    const { root } = setup("<p>one <strong>two</strong></p><p>three</p>");
    select(root, "wo", "two");
    const saved = saveSelection(root);

    root.innerHTML = "<p>one <em>two</em></p><p>three</p>";
    restoreSelection(root, saved);

    expect(window.getSelection()?.toString()).toBe("wo");
  });

  it("tells the end of one block from the start of the next", () => {
    const { root } = setup("<p>ab</p><p>cd</p>");
    caret(root, "cd", 0);
    const atStart = saveSelection(root);
    caret(root, "ab", 2);
    const atEnd = saveSelection(root);

    expect(atStart?.anchor).not.toBe(atEnd?.anchor);
    restoreSelection(root, atStart);
    expect(window.getSelection()?.anchorNode?.parentElement?.textContent).toBe(
      "cd",
    );
  });
});

describe("toggleMark", () => {
  it("wraps only the selected part of a text node", () => {
    const { root, editing } = setup("<p>hello world</p>");
    select(root, "world");

    editing.toggleMark("strong");

    expect(root.innerHTML).toBe("<p>hello <strong>world</strong></p>");
    expect(window.getSelection()?.toString()).toBe("world");
  });

  it("removes the mark when the whole selection has it, splitting around it", () => {
    const { root, editing } = setup("<p><strong>abcdef</strong></p>");
    select(root, "cd", "abcdef");

    editing.toggleMark("strong");

    expect(root.innerHTML).toBe(
      "<p><strong>ab</strong>cd<strong>ef</strong></p>",
    );
  });

  it("adds the mark across a selection that only partly has it", () => {
    const { root, editing } = setup("<p>a <strong>b</strong> c</p>");
    selectAcross(root, "a ", " c");

    editing.toggleMark("strong");

    expect(root.innerHTML).toBe("<p><strong>a b c</strong></p>");
  });

  it("marks every block in a multi-block selection", () => {
    const { root, editing } = setup(
      "<p>one</p><p>two</p><ul><li>three</li></ul>",
    );
    selectAcross(root, "one", "three");

    editing.toggleMark("em");

    expect(root.innerHTML).toBe(
      "<p><em>one</em></p><p><em>two</em></p><ul><li><em>three</em></li></ul>",
    );
  });

  it("merges neighbouring marks of the same kind", () => {
    const { root, editing } = setup("<p><em>ab</em>cd<em>ef</em></p>");
    select(root, "cd");

    editing.toggleMark("em");

    expect(root.innerHTML).toBe("<p><em>abcdef</em></p>");
  });

  describe("at a caret", () => {
    it("turns the mark on for the next text with a zero-width filler", () => {
      const { root, editing } = setup("<p>ab</p>");
      caret(root, "ab", 2);

      editing.toggleMark("strong");

      const filler = window.getSelection()?.anchorNode as Text;
      expect(filler.parentElement?.nodeName).toBe("STRONG");
      expect(editing.queryState().has("strong")).toBe(true);

      // The browser types into the filler's text node.
      filler.insertData(1, "c");
      editing.flushPending();
      expect(root.innerHTML).toBe("<p>ab<strong>c</strong></p>");
    });

    it("drops the filler when the caret leaves without typing", () => {
      const { root, editing } = setup("<p>ab</p><p>cd</p>");
      caret(root, "ab", 2);
      editing.toggleMark("strong");

      caret(root, "cd", 0);
      editing.flushPending();

      expect(root.innerHTML).toBe("<p>ab</p><p>cd</p>");
    });

    it("leaves a mark by splitting it at the caret", () => {
      const { root, editing } = setup("<p><strong>abcd</strong></p>");
      caret(root, "abcd", 2);

      editing.toggleMark("strong");

      const filler = window.getSelection()?.anchorNode as Text;
      filler.insertData(1, "X");
      editing.flushPending();
      expect(root.innerHTML).toBe(
        "<p><strong>ab</strong>X<strong>cd</strong></p>",
      );
    });
  });
});

describe("setBlock", () => {
  it("turns paragraphs into a heading and back", () => {
    const { root, editing } = setup("<p>one</p><p>two</p>");
    selectAcross(root, "one", "two");

    editing.setBlock("h2");
    expect(root.innerHTML).toBe("<h2>one</h2><h2>two</h2>");

    editing.setBlock("h2");
    expect(root.innerHTML).toBe("<p>one</p><p>two</p>");
  });

  it("keeps the selection and the marks", () => {
    const { root, editing } = setup("<p>a <strong>bold</strong> b</p>");
    select(root, "bold");

    editing.setBlock("h3");

    expect(root.innerHTML).toBe("<h3>a <strong>bold</strong> b</h3>");
    expect(window.getSelection()?.toString()).toBe("bold");
  });

  it("leaves list items and quoted paragraphs alone", () => {
    const { root, editing } = setup(
      "<ul><li>item</li></ul><blockquote><p>quoted</p></blockquote>",
    );
    selectAcross(root, "item", "quoted");

    editing.setBlock("h2");

    expect(root.innerHTML).toBe(
      "<ul><li>item</li></ul><blockquote><p>quoted</p></blockquote>",
    );
  });
});

describe("lists", () => {
  it("wraps adjacent paragraphs in one list", () => {
    const { root, editing } = setup("<p>one</p><p>two</p><p>three</p>");
    selectAcross(root, "one", "two");

    editing.toggleList("ul");

    expect(root.innerHTML).toBe(
      "<ul><li>one</li><li>two</li></ul><p>three</p>",
    );
  });

  it("joins a list it makes to the one before it", () => {
    const { root, editing } = setup("<ul><li>one</li></ul><p>two</p>");
    caret(root, "two", 1);

    editing.toggleList("ul");

    expect(root.innerHTML).toBe("<ul><li>one</li><li>two</li></ul>");
  });

  it("switches the kind of a list", () => {
    const { root, editing } = setup("<ul><li>one</li><li>two</li></ul>");
    caret(root, "one", 1);

    editing.toggleList("ol");

    expect(root.innerHTML).toBe("<ol><li>one</li><li>two</li></ol>");
  });

  it("takes an item out of the list, splitting it", () => {
    const { root, editing } = setup("<ul><li>a</li><li>b</li><li>c</li></ul>");
    caret(root, "b", 1);

    editing.toggleList("ul");

    expect(root.innerHTML).toBe(
      "<ul><li>a</li></ul><p>b</p><ul><li>c</li></ul>",
    );
    expect(window.getSelection()?.anchorNode?.parentElement?.nodeName).toBe(
      "P",
    );
  });

  it("indents an item under the one before it", () => {
    const { root, editing } = setup("<ul><li>a</li><li>b</li></ul>");
    caret(root, "b", 1);

    expect(editing.indent()).toBe(true);

    expect(root.innerHTML).toBe("<ul><li>a<ul><li>b</li></ul></li></ul>");
  });

  it("does not indent the first item", () => {
    const { root, editing } = setup("<ul><li>a</li><li>b</li></ul>");
    caret(root, "a", 0);

    expect(editing.indent()).toBe(false);
  });

  it("appends an indented item to the sub-list it already has", () => {
    const { root, editing } = setup(
      "<ul><li>a<ul><li>b</li></ul></li><li>c</li></ul>",
    );
    caret(root, "c", 0);

    editing.indent();

    expect(root.innerHTML).toBe(
      "<ul><li>a<ul><li>b</li><li>c</li></ul></li></ul>",
    );
  });

  it("outdents an item, adopting the items after it", () => {
    const { root, editing } = setup(
      "<ul><li>a<ul><li>b</li><li>c</li></ul></li></ul>",
    );
    caret(root, "b", 0);

    editing.outdent();

    expect(root.innerHTML).toBe(
      "<ul><li>a</li><li>b<ul><li>c</li></ul></li></ul>",
    );
  });

  it("outdents a top-level item into a paragraph", () => {
    const { root, editing } = setup("<ol><li>a</li><li>b</li></ol>");
    caret(root, "a", 1);

    editing.outdent();

    expect(root.innerHTML).toBe("<p>a</p><ol><li>b</li></ol>");
  });
});

describe("toggleBlockquote", () => {
  it("quotes adjacent paragraphs together and unquotes them", () => {
    const { root, editing } = setup("<p>one</p><p>two</p>");
    selectAcross(root, "one", "two");

    editing.toggleBlockquote();
    expect(root.innerHTML).toBe(
      "<blockquote><p>one</p><p>two</p></blockquote>",
    );

    editing.toggleBlockquote();
    expect(root.innerHTML).toBe("<p>one</p><p>two</p>");
  });

  it("turns a heading into a quoted paragraph", () => {
    const { root, editing } = setup("<h2>title</h2>");
    caret(root, "title", 1);

    editing.toggleBlockquote();

    expect(root.innerHTML).toBe("<blockquote><p>title</p></blockquote>");
  });
});

describe("links", () => {
  it("links the selection", () => {
    const { root, editing } = setup("<p>see docs here</p>");
    select(root, "docs");

    editing.setLink("https://example.com");

    expect(root.innerHTML).toBe(
      '<p>see <a href="https://example.com">docs</a> here</p>',
    );
    expect(editing.queryState().has("link")).toBe(true);
  });

  it("retargets the link under a caret", () => {
    const { root, editing } = setup('<p><a href="/a">docs</a></p>');
    caret(root, "docs", 2);

    editing.setLink("/b");

    expect(root.innerHTML).toBe('<p><a href="/b">docs</a></p>');
  });

  it("inserts a link with text at a caret", () => {
    const { root, editing } = setup("<p>ab</p>");
    caret(root, "ab", 1);

    editing.setLink("https://example.com", "site");
    caret(root, "b", 0);
    editing.flushPending();

    expect(root.innerHTML).toBe(
      '<p>a<a href="https://example.com">site</a>b</p>',
    );
  });

  it("removes a link but keeps its text", () => {
    const { root, editing } = setup('<p>a <a href="/a">link</a> b</p>');
    caret(root, "link", 2);

    editing.removeLink();

    expect(root.innerHTML).toBe("<p>a link b</p>");
  });

  it("replaces a link under a selection that spans it", () => {
    const { root, editing } = setup('<p><a href="/a">one</a> two</p>');
    selectAcross(root, "one", " two");

    editing.setLink("/b");

    expect(root.innerHTML).toBe('<p><a href="/b">one two</a></p>');
  });
});

describe("clearFormatting", () => {
  it("strips marks and headings but keeps links and lists", () => {
    const { root, editing } = setup(
      '<h2><strong>a</strong> <a href="/x"><em>b</em></a></h2><ul><li><u>c</u></li></ul>',
    );
    selectAcross(root, "a", "c");

    editing.clearFormatting();

    expect(root.innerHTML).toBe(
      '<p>a <a href="/x">b</a></p><ul><li>c</li></ul>',
    );
  });
});

describe("insertHtml", () => {
  it("joins a single pasted paragraph to the text around the caret", () => {
    const { root, editing } = setup("<p>ad</p>");
    caret(root, "ad", 1);

    editing.insertHtml("<p>b<strong>c</strong></p>");

    expect(root.innerHTML).toBe("<p>ab<strong>c</strong>d</p>");
    const range = window.getSelection()?.getRangeAt(0);
    expect(range?.collapsed).toBe(true);
    expect(root.textContent?.slice(0, 3)).toBe("abc");
  });

  it("replaces the selection", () => {
    const { root, editing } = setup("<p>one two three</p>");
    select(root, "two");

    editing.insertHtml("<p>2</p>");

    expect(root.innerHTML).toBe("<p>one 2 three</p>");
  });

  it("splits the block around several pasted blocks", () => {
    const { root, editing } = setup("<p>startend</p>");
    caret(root, "startend", 5);

    editing.insertHtml("<p>one</p><p>two</p><p>three</p>");

    expect(root.innerHTML).toBe("<p>startone</p><p>two</p><p>threeend</p>");
  });

  it("pastes a list between the halves of a paragraph", () => {
    const { root, editing } = setup("<p>startend</p>");
    caret(root, "startend", 5);

    editing.insertHtml("<ul><li>a</li><li>b</li></ul>");

    expect(root.innerHTML).toBe(
      "<p>start</p><ul><li>a</li><li>b</li></ul><p>end</p>",
    );
  });

  it("replaces an empty paragraph with a pasted list", () => {
    const { root, editing } = setup("<p><br></p>");
    const p = root.firstElementChild as Element;
    window.getSelection()?.collapse(p, 0);

    editing.insertHtml("<ul><li>a</li></ul>");

    expect(root.innerHTML).toBe("<ul><li>a</li></ul>");
  });

  it("pastes several blocks into a list item as items", () => {
    const { root, editing } = setup("<ul><li>x</li></ul>");
    caret(root, "x", 1);

    editing.insertHtml("<p>a</p><p>b</p>");

    expect(root.innerHTML).toBe("<ul><li>xa</li><li>b</li></ul>");
  });

  it("pastes several blocks into a quote as quoted paragraphs", () => {
    const { root, editing } = setup("<blockquote><p>x</p></blockquote>");
    caret(root, "x", 1);

    editing.insertHtml("<h2>a</h2><p>b</p>");

    expect(root.innerHTML).toBe("<blockquote><p>xa</p><p>b</p></blockquote>");
  });
});

describe("normalize", () => {
  it("wraps text typed straight into an empty editor", () => {
    const { root, editing } = setup("");
    root.textContent = "typed";

    expect(editing.normalize()).toBe(true);

    expect(root.innerHTML).toBe("<p>typed</p>");
  });

  it("turns a browser-made div into a paragraph and drops its styles", () => {
    const { root, editing } = setup(
      '<p>a</p><div style="color:red">b <span style="font-size:20px">c</span></div>',
    );

    editing.normalize();

    expect(root.innerHTML).toBe("<p>a</p><p>b c</p>");
  });

  it("rebuilds only the dirty block, keeping the caret", () => {
    const { root, editing } = setup(
      '<p>keep <font color="red">me</font></p><p>untouched</p>',
    );
    caret(root, "me", 1);

    editing.normalize(root.firstElementChild);

    expect(root.innerHTML).toBe("<p>keep me</p><p>untouched</p>");
    expect(window.getSelection()?.anchorNode?.textContent).toContain("me");
  });

  it("gives an empty block a line break and removes a stray placeholder", () => {
    const { root, editing } = setup("<p></p><p>text<br></p>");

    editing.normalize();

    expect(root.innerHTML).toBe("<p><br></p><p>text</p>");
  });

  it("repairs an element outside the schema nested in a quote", () => {
    const { root, editing } = setup("<blockquote><div>a</div></blockquote>");

    editing.normalize();

    expect(root.innerHTML).toBe("<blockquote><p>a</p></blockquote>");
  });
});

describe("queryState", () => {
  it("reports marks, the block kind and links at a caret", () => {
    const { root, editing } = setup(
      '<h2><strong><a href="/a">title</a></strong></h2>',
    );
    caret(root, "title", 2);

    const state = editing.queryState();

    expect([...state].sort()).toEqual(["h2", "link", "strong"]);
  });

  it("reports a mark only when it covers the whole selection", () => {
    const { root, editing } = setup("<p><strong>a</strong>b</p>");
    selectAcross(root, "a", "b");

    expect(editing.queryState().has("strong")).toBe(false);
    select(root, "a");
    expect(editing.queryState().has("strong")).toBe(true);
  });

  it("reports lists and quotes", () => {
    const { root, editing } = setup(
      "<ol><li>one</li></ol><blockquote><p>q</p></blockquote>",
    );
    caret(root, "one", 1);
    expect([...editing.queryState()].sort()).toEqual(["list", "ol"]);

    caret(root, "q", 1);
    expect(editing.queryState().has("blockquote")).toBe(true);
  });
});
