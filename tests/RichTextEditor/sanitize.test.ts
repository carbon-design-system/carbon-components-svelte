import {
  htmlToText,
  isEmptyHtml,
  normalizeHref,
  safeHref,
  sanitizeHtml,
  textToHtml,
} from "../../src/RichTextEditor/sanitize.js";

describe("sanitizeHtml", () => {
  describe("schema", () => {
    it.each([
      ["<b>a</b>", "<p><strong>a</strong></p>"],
      ["<i>a</i>", "<p><em>a</em></p>"],
      ["<strike>a</strike>", "<p><s>a</s></p>"],
      ["<tt>a</tt>", "<p><code>a</code></p>"],
      ["<h1>a</h1>", "<h2>a</h2>"],
      ["<h4>a</h4>", "<h3>a</h3>"],
      ["<div>a<div>b</div></div>", "<p>a</p><p>b</p>"],
      ["a<p>b</p>c", "<p>a</p><p>b</p><p>c</p>"],
    ])("rewrites %s", (input, expected) => {
      expect(sanitizeHtml(input)).toBe(expected);
    });

    it("nests marks in one canonical order and merges neighbours", () => {
      expect(sanitizeHtml("<em><b>a</b></em><b><em>b</em></b>")).toBe(
        "<p><strong><em>ab</em></strong></p>",
      );
    });

    it("builds nested lists and closes implied list items", () => {
      expect(
        sanitizeHtml("<ul><li>a<ul><li>b<li>c</ul><li>d</ul><ol><li>1</ol>"),
      ).toBe(
        "<ul><li>a<ul><li>b</li><li>c</li></ul></li><li>d</li></ul><ol><li>1</li></ol>",
      );
    });

    it("keeps quoted paragraphs and turns a quoted list into paragraphs", () => {
      expect(
        sanitizeHtml("<blockquote>q<ul><li>a</li></ul></blockquote>"),
      ).toBe("<blockquote><p>q</p><p>a</p></blockquote>");
    });

    it("keeps line breaks, drops a trailing one, and keeps blank paragraphs", () => {
      expect(sanitizeHtml("<p>a<br>b<br></p><p><br></p>")).toBe(
        "<p>a<br>b</p><p><br></p>",
      );
    });

    it("collapses source whitespace but keeps non-breaking spaces", () => {
      expect(
        sanitizeHtml("<p>\n  a   \n b&nbsp;&nbsp;c  </p>\n<p> d </p>"),
      ).toBe("<p>a b&nbsp;&nbsp;c</p><p>d</p>");
    });

    it("flattens a table into paragraphs", () => {
      expect(sanitizeHtml("<table><tr><td>A</td><td>B</td></tr></table>")).toBe(
        "<p>A</p><p>B</p>",
      );
    });

    it("keeps line breaks in preformatted text as code", () => {
      expect(sanitizeHtml("<pre>a\n  b</pre>")).toBe(
        "<p><code>a<br>  b</code></p>",
      );
    });

    it("returns an empty string for a document without text", () => {
      expect(sanitizeHtml("<p><br></p><p>&nbsp;</p>")).toBe("");
      expect(sanitizeHtml(null)).toBe("");
    });

    it("round-trips its own output", () => {
      const html =
        '<h2>T</h2><p>a <strong>b</strong><br>c <a href="https://x.test/?a=1&amp;b=2">d</a> &lt;e&gt;</p><ol><li>1<ul><li>2</li></ul></li></ol><blockquote><p>q</p></blockquote>';
      expect(sanitizeHtml(html)).toBe(html);
    });
  });

  describe("security", () => {
    it("drops scripts, styles, frames and event handlers", () => {
      expect(
        sanitizeHtml(
          '<p onclick="x()" style="color:red">a</p><script>alert(1)</script><style>p{}</style><iframe src=x></iframe><img src=x onerror=alert(1)><svg><script>1</script></svg>b',
        ),
      ).toBe("<p>a</p><p>b</p>");
    });

    it("escapes text that looks like markup", () => {
      expect(sanitizeHtml("a < b > c &lt;script&gt; <3")).toBe(
        "<p>a &lt; b &gt; c &lt;script&gt; &lt;3</p>",
      );
    });

    it("never leaves an attribute value to break out of its quotes", () => {
      expect(
        sanitizeHtml(`<a href='https://x.test/" onmouseover="y'>a</a>`),
      ).toBe(
        '<p><a href="https://x.test/&quot; onmouseover=&quot;y">a</a></p>',
      );
    });

    it.each([
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "java\tscript:alert(1)",
      " javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:x",
      "&#106;avascript:alert(1)",
    ])("drops the link to %j but keeps its text", (href) => {
      expect(sanitizeHtml(`<a href="${href}">x</a>`)).toBe("<p>x</p>");
    });

    it.each([
      "https://a.test",
      "mailto:a@b.test",
      "tel:+1",
      "/path",
      "#id",
      "?q=1",
      "a/b",
    ])("keeps the link to %s", (href) => {
      expect(sanitizeHtml(`<a href="${href}">x</a>`)).toContain(
        `href="${href}"`,
      );
    });

    it("takes the schemes a caller allows", () => {
      expect(sanitizeHtml('<a href="ftp://a.test">x</a>')).toBe("<p>x</p>");
      expect(
        sanitizeHtml('<a href="ftp://a.test">x</a>', { protocols: ["ftp"] }),
      ).toBe('<p><a href="ftp://a.test">x</a></p>');
    });

    it("ends the input at an unterminated tag, as a browser does", () => {
      expect(sanitizeHtml("<p>a</p><a href='x")).toBe("<p>a</p>");
    });

    it("stays fast on input built to be slow", () => {
      const start = performance.now();
      sanitizeHtml('<a "'.repeat(20000));
      sanitizeHtml("<div>".repeat(50000));
      sanitizeHtml(`<p>${"<b>".repeat(50000)}x`);
      expect(performance.now() - start).toBeLessThan(1000);
    });

    it("removes zero-width spaces, which mark a caret's pending format", () => {
      expect(sanitizeHtml("<p>a​b</p>")).toBe("<p>ab</p>");
    });
  });

  describe("pasted from other editors", () => {
    it("reads Google Docs: a bold wrapper that is not bold, spans styled for weight", () => {
      const html = `<meta charset='utf-8'><b style="font-weight:normal;" id="docs-internal-guid-1"><p dir="ltr" style="line-height:1.38"><span style="font-size:11pt;font-weight:700;">Bold</span><span style="font-style:italic;"> it</span><span style="text-decoration:line-through;"> gone</span></p><ul><li dir="ltr"><p dir="ltr"><span>one</span></p></li><li dir="ltr"><p dir="ltr"><span>two</span></p><ul><li><p><span>nested</span></p></li></ul></li></ul></b>`;
      expect(sanitizeHtml(html)).toBe(
        "<p><strong>Bold</strong><em> it</em><s> gone</s></p><ul><li>one</li><li>two<ul><li>nested</li></ul></li></ul>",
      );
    });

    it("does not underline a link for the underline Docs gives it", () => {
      expect(
        sanitizeHtml(
          '<a href="https://x.test"><span style="text-decoration:underline">x</span></a>',
        ),
      ).toBe('<p><a href="https://x.test">x</a></p>');
    });

    it("reads Word: conditional comments, o:p, spacing paragraphs and list marker spans", () => {
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><style>p.MsoNormal{margin:0}</style></head><body><!--StartFragment--><p class=MsoNormal><b><span style='font-size:12.0pt'>Title<o:p></o:p></span></b></p><p class=MsoNormal><o:p>&nbsp;</o:p></p><p class=MsoListParagraphCxSpFirst style='mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span><![endif]>First<o:p></o:p></p><p class=MsoListParagraphCxSpMiddle style='mso-list:l0 level2 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>o<span>&nbsp;</span></span><![endif]>Nested<o:p></o:p></p><p class=MsoListParagraphCxSpLast style='mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>·</span><![endif]>Second<o:p></o:p></p><!--EndFragment--></body></html>`;
      expect(sanitizeHtml(html)).toBe(
        "<p><strong>Title</strong></p><p><br></p><ul><li>First<ul><li>Nested</li></ul></li><li>Second</li></ul>",
      );
    });

    it("reads Word's numbered list markers as an ordered list", () => {
      const item = (n: number, text: string) =>
        `<p class=MsoListParagraph style='mso-list:l1 level1 lfo2'><![if !supportLists]><span style='mso-list:Ignore'>${n}.<span>&nbsp;</span></span><![endif]>${text}</p>`;
      expect(sanitizeHtml(item(1, "a") + item(2, "b"))).toBe(
        "<ol><li>a</li><li>b</li></ol>",
      );
    });

    it("keeps a space at the edges for a fragment pasted into a line, when asked", () => {
      expect(sanitizeHtml("<p> big </p>")).toBe("<p>big</p>");
      expect(sanitizeHtml("<p> big </p>", { edges: true })).toBe(
        "<p> big </p>",
      );
    });
  });
});

describe("safeHref", () => {
  it("trims, and rejects empty and scheme-less script tricks", () => {
    expect(safeHref("  https://a.test ")).toBe("https://a.test");
    expect(safeHref("")).toBeUndefined();
    expect(safeHref("\u0001javascript:x")).toBeUndefined();
  });
});

describe("normalizeHref", () => {
  it.each([
    ["example.com", "https://example.com"],
    ["example.com/a?b#c", "https://example.com/a?b#c"],
    ["a@b.test", "mailto:a@b.test"],
    ["http://a.test", "http://a.test"],
    ["/docs", "/docs"],
    ["#top", "#top"],
    ["javascript:alert(1)", undefined],
    ["not a url", undefined],
    ["", undefined],
  ])("turns %j into %j", (input, expected) => {
    expect(normalizeHref(input)).toBe(expected);
  });
});

describe("text helpers", () => {
  it("turns plain text into paragraphs, escaped", () => {
    expect(textToHtml("a\nb\n\n\nc <b> & d")).toBe(
      "<p>a<br>b</p><p>c &lt;b&gt; &amp; d</p>",
    );
    expect(textToHtml("")).toBe("");
  });

  it("reads the text back, a line per block", () => {
    const html = "<p>a<br>b</p><ul><li>c &amp; d</li></ul>";
    expect(htmlToText(html)).toBe("a\nb\nc & d");
    expect(htmlToText("<p>x</p><script>y</script>&lt;b&gt;")).toBe("x\n<b>");
  });

  it("knows an empty document", () => {
    expect(isEmptyHtml("")).toBe(true);
    expect(isEmptyHtml("<p><br></p><p>&nbsp;</p>")).toBe(true);
    expect(isEmptyHtml("<p><br></p><p>a</p>")).toBe(false);
  });
});
