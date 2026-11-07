import {
  buildTextIndex,
  offsetOfPoint,
  offsetsFromRange,
  rangeFromOffsets,
  trimOffsets,
} from "../../src/TextAnnotations/text-index.js";

function setup(html: string) {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.append(root);
  return root;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("text index", () => {
  it("joins the text nodes through inline markup", () => {
    const root = setup("<p>The <em>quick</em> brown <a href='#'>fox</a>.</p>");
    expect(buildTextIndex(root).text).toBe("The quick brown fox.");
  });

  it("leaves out scripts, styles and ignored subtrees", () => {
    const root = setup(
      "<p>Keep</p><script>drop()</script><style>.x{}</style><div data-ccs-annotation-ignore>skip <b>this</b></div><p>too</p>",
    );
    expect(buildTextIndex(root).text).toBe("Keeptoo");
  });

  it("gives a range for offsets that cross markup", () => {
    const root = setup("<p>The <em>quick</em> brown fox</p>");
    const index = buildTextIndex(root);
    const range = rangeFromOffsets(index, 4, 15)!;
    expect(range.toString()).toBe("quick brown");
  });

  it("starts a range in the next node at a boundary and ends it in the last", () => {
    const root = setup("<p>one<b>two</b>three</p>");
    const index = buildTextIndex(root);
    const range = rangeFromOffsets(index, 3, 6)!;
    expect(range.startContainer.textContent).toBe("two");
    expect(range.endContainer.textContent).toBe("two");
    expect(range.toString()).toBe("two");
  });

  it("reads offsets back from a range, from text and from element points", () => {
    const root = setup("<p>The <em>quick</em> brown fox</p>");
    const index = buildTextIndex(root);
    const em = root.querySelector("em")!;
    const range = document.createRange();
    range.selectNodeContents(em);
    expect(offsetsFromRange(index, range)).toEqual({ start: 4, end: 9 });

    const wide = document.createRange();
    wide.setStart(root, 0);
    wide.setEnd(root, root.childNodes.length);
    expect(offsetsFromRange(index, wide)).toEqual({ start: 0, end: 19 });
    expect(offsetOfPoint(index, root.firstChild!, 1)).toBe(4);
  });

  it("round-trips offsets over a document with many nodes", () => {
    const html = Array.from(
      { length: 300 },
      (_, i) => `<p>Clause ${i} <em>binds</em> the <b>parties</b>.</p>`,
    ).join("");
    const root = setup(html);
    const index = buildTextIndex(root);
    for (const [start, end] of [
      [0, 5],
      [1234, 1300],
      [index.text.length - 20, index.text.length],
    ]) {
      const range = rangeFromOffsets(index, start, end)!;
      expect(range.toString()).toBe(index.text.slice(start, end));
      expect(offsetsFromRange(index, range)).toEqual({ start, end });
    }
  });

  it("trims space and breaks from the edges of an offset pair", () => {
    expect(trimOffsets("  hello world \n", 0, 15)).toEqual({
      start: 2,
      end: 13,
    });
    expect(trimOffsets("   ", 0, 3)).toEqual({ start: 3, end: 3 });
  });

  it("returns null when there is no text", () => {
    const root = setup("<p></p>");
    expect(rangeFromOffsets(buildTextIndex(root), 0, 0)).toBeNull();
  });
});
