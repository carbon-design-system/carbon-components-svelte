import {
  htmlToText,
  MAX_DEPTH,
  sanitizeHtml,
} from "../../src/utils/sanitize-html.js";
import {
  expectWithin,
  prefixesAndSuffixes,
  randomString,
  seeded,
  tokenSoup,
} from "./fuzz";

// Payloads from the OWASP XSS Filter Evasion Cheat Sheet. None may leave a
// script, an event handler or a code-bearing URL in the output.
const PAYLOADS: Array<[string, string]> = [
  ["script tag", "<script>alert('XSS')</script>"],
  ["script with src", '<script src="//evil.example/x.js"></script>'],
  ["script, mixed case", "<ScRiPt>alert(1)</sCrIpT>"],
  ["script, no closing tag", "<script>alert(1)"],
  ["script, closing tag with space", "<script>alert(1)</script >"],
  ["script, nested name", "<scr<script>ipt>alert(1)</scr</script>ipt>"],
  ["script in comment", "<!--<script>alert(1)</script>-->"],
  ["img onerror", "<img src=x onerror=alert(1)>"],
  ["img onerror, quoted", '<img src="x" onerror="alert(1)">'],
  ["img onerror, slash separator", "<img/src=x/onerror=alert(1)>"],
  ["img onerror, no quotes or spaces", "<img src=`x`onerror=alert(1)>"],
  ["img with javascript src", '<img src="javascript:alert(1)">'],
  ["svg onload", "<svg onload=alert(1)>"],
  ["svg with script", "<svg><script>alert(1)</script></svg>"],
  ["svg animate", "<svg><animate onbegin=alert(1) attributeName=x dur=1s>"],
  ["math", '<math><mi xlink:href="javascript:alert(1)">x</mi></math>'],
  ["body onload", "<body onload=alert(1)>"],
  ["iframe", '<iframe src="javascript:alert(1)"></iframe>'],
  ["iframe srcdoc", '<iframe srcdoc="<script>alert(1)</script>">'],
  ["object", '<object data="javascript:alert(1)"></object>'],
  ["embed", '<embed src="data:text/html,<script>alert(1)</script>">'],
  ["link", '<link rel=stylesheet href="javascript:alert(1)">'],
  [
    "meta refresh",
    '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
  ],
  ["base", '<base href="javascript:alert(1)//">'],
  ["style tag", "<style>@import 'javascript:alert(1)';</style>"],
  ["style attribute", '<p style="background:url(javascript:alert(1))">x</p>'],
  ["style expression", '<p style="width:expression(alert(1))">x</p>'],
  ["a javascript href", '<a href="javascript:alert(1)">x</a>'],
  ["a javascript href, upper case", '<a href="JAVASCRIPT:alert(1)">x</a>'],
  ["a href with tab", '<a href="java\tscript:alert(1)">x</a>'],
  ["a href with entity tab", '<a href="java&#x09;script:alert(1)">x</a>'],
  ["a href with entity newline", '<a href="java&#10;script:alert(1)">x</a>'],
  ["a href with named tab", '<a href="java&Tab;script:alert(1)">x</a>'],
  ["a href with named colon", '<a href="javascript&colon;alert(1)">x</a>'],
  ["a href with numeric entity", '<a href="&#106;avascript:alert(1)">x</a>'],
  ["a href with padded entity", '<a href="&#0000106avascript:alert(1)">x</a>'],
  [
    "a href with hex entity, no semicolon",
    '<a href="&#x6A avascript:alert(1)">x</a>',
  ],
  ["a href, leading space", '<a href=" javascript:alert(1)">x</a>'],
  ["a href, leading control", '<a href="\x01javascript:alert(1)">x</a>'],
  ["a href, unquoted", "<a href=javascript:alert(1)>x</a>"],
  ["a href, single quoted", "<a href='javascript:alert(1)'>x</a>"],
  ["a href, vbscript", '<a href="vbscript:msgbox(1)">x</a>'],
  [
    "a href, data html",
    '<a href="data:text/html,<script>alert(1)</script>">x</a>',
  ],
  [
    "a href, data base64",
    '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>',
  ],
  ["a onclick", '<a href="/ok" onclick="alert(1)">x</a>'],
  ["a onmouseover, upper case", '<a href="/ok" ONMOUSEOVER="alert(1)">x</a>'],
  ["a with duplicate href", '<a href="/ok" href="javascript:alert(1)">x</a>'],
  [
    "form action",
    '<form action="javascript:alert(1)"><button>x</button></form>',
  ],
  ["button formaction", '<button formaction="javascript:alert(1)">x</button>'],
  ["input autofocus", "<input autofocus onfocus=alert(1)>"],
  ["details ontoggle", "<details open ontoggle=alert(1)>"],
  ["video onerror", "<video><source onerror=alert(1)>"],
  ["marquee", "<marquee onstart=alert(1)>x</marquee>"],
  ["unclosed tag", "<img src=x onerror=alert(1)"],
  ["unclosed quote", '<a href="javascript:alert(1)>x</a>'],
  ["backtick attribute", "<a href=`javascript:alert(1)`>x</a>"],
  ["null byte in tag", "<scr\x00ipt>alert(1)</scr\x00ipt>"],
  ["null byte in attribute", "<img src=x on\x00error=alert(1)>"],
  ["comment break", "<!--><img src=x onerror=alert(1)>-->"],
  ["bogus comment", "<!x><img src=x onerror=alert(1)>"],
  ["processing instruction", "<?php echo 1; ?><img src=x onerror=alert(1)>"],
  ["CDATA", "<![CDATA[<img src=x onerror=alert(1)>]]>"],
  ["template", "<template><script>alert(1)</script></template>"],
  [
    "noscript breakout",
    '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
  ],
  ["textarea breakout", "<textarea></textarea><img src=x onerror=alert(1)>"],
  ["title breakout", "<title></title><img src=x onerror=alert(1)>"],
  ["xmp", "<xmp><img src=x onerror=alert(1)></xmp>"],
  ["plaintext", "<plaintext><img src=x onerror=alert(1)>"],
  ["style breakout", "<style></style><img src=x onerror=alert(1)>"],
  [
    "select mutation",
    "<select><template><style></select><img src=x onerror=alert(1)>",
  ],
  [
    "table mutation",
    "<table><a href=x><style></table><img src=x onerror=alert(1)>",
  ],
  [
    "math mutation",
    "<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>",
  ],
  [
    "svg mutation",
    '<svg><p><style><a id="</style><img src=1 onerror=alert(1)>">',
  ],
  [
    "form nesting mutation",
    "<form><math><mtext></form><form><mglyph><style></math><img src onerror=alert(1)>",
  ],
  ["encoded tag", "&lt;script&gt;alert(1)&lt;/script&gt;"],
  ["double encoded tag", "&amp;lt;script&amp;gt;alert(1)"],
  ["numeric entity tag", "&#60;script&#62;alert(1)&#60;/script&#62;"],
  ["entity without semicolon", "&lt;script&gt alert(1)"],
  ["US-ASCII encoding trick", "¼script¾alert(1)¼/script¾"],
  ["UTF-7", "+ADw-script+AD4-alert(1)+ADw-/script+AD4-"],
  ["javascript in text", "javascript:alert(1)"],
];

/** What must not appear in markup that is going to be parsed again. */
function expectNoActiveContent(output: string) {
  expect(output).not.toMatch(
    /<\s*\/?\s*(script|style|iframe|object|embed|svg|math|template|link|meta|base|form|input|button|img|video|audio|source|body|details|marquee|textarea|title|xmp|noscript)/i,
  );
  // Parse it as a browser would: only default tags, only href, title and
  // rel, and every link resolves to a page, not to code.
  const host = document.createElement("div");
  host.innerHTML = output;
  for (const element of host.querySelectorAll("*")) {
    expect(DEFAULT_TAGS).toContain(element.localName);
    for (const attribute of element.attributes) {
      expect(["href", "title", "rel"]).toContain(attribute.name);
    }
  }
  for (const link of host.querySelectorAll("a")) {
    const href = link.getAttribute("href") ?? "";

    expect(new URL(href, "https://example.com/").protocol).toMatch(
      /^(https?|mailto):$/,
    );
  }
}

const DEFAULT_TAGS = [
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "code",
  "dd",
  "del",
  "dl",
  "dt",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "ins",
  "kbd",
  "li",
  "mark",
  "ol",
  "p",
  "pre",
  "q",
  "s",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "u",
  "ul",
];

describe("sanitizeHtml vectors", () => {
  it.each(PAYLOADS)("removes active content from %s", (_name, payload) => {
    expectNoActiveContent(sanitizeHtml(payload));
  });

  it.each(PAYLOADS)(
    "leaves nothing to execute after a second pass: %s",
    (_name, payload) => {
      const once = sanitizeHtml(payload);

      expect(sanitizeHtml(once)).toBe(once);
    },
  );

  it("renders no element and no handler when the output is parsed by a browser", () => {
    for (const [, payload] of PAYLOADS) {
      const host = document.createElement("div");
      host.innerHTML = sanitizeHtml(payload);

      expect(
        host.querySelectorAll(
          "script, img, svg, iframe, object, embed, style, form",
        ),
      ).toHaveLength(0);
      for (const element of host.querySelectorAll("*")) {
        for (const attribute of element.attributes) {
          expect(attribute.name).not.toMatch(/^on/);
          expect(attribute.name).not.toBe("style");
        }
      }
      for (const link of host.querySelectorAll("a")) {
        const href = link.getAttribute("href") ?? "";
        expect(href).not.toMatch(/^\s*(javascript|vbscript|data):/i);
        expect(new URL(href, "https://example.com/").protocol).toMatch(
          /^(https?|mailto):$/,
        );
      }
    }
  });

  it("keeps the text of a removed element that is not a code container", () => {
    expect(
      sanitizeHtml(
        "<custom-tag>hello</custom-tag> <font color=red>there</font>",
      ),
    ).toBe("hello there");
  });

  it("drops the content of script, style, svg, template and the like", () => {
    expect(
      sanitizeHtml(
        "a<script>b</script>c<style>d</style>e<svg><g>f</g></svg>g<template>h</template>i",
      ),
    ).toBe("aceg" + "i");
  });

  it("drops everything after an unterminated comment, tag or raw text element", () => {
    expect(sanitizeHtml("a<!-- b")).toBe("a");
    expect(sanitizeHtml("a<b")).toBe("a");
    expect(sanitizeHtml('a<img src="x')).toBe("a");
    expect(sanitizeHtml("a<script>b")).toBe("a");
    expect(sanitizeHtml("a<plaintext>b<b>c")).toBe("a");
  });
});

describe("sanitizeHtml output", () => {
  it("keeps the default tags and the allowed attributes of a link", () => {
    expect(
      sanitizeHtml(
        '<h5>Title</h5><p>Some <strong>bold</strong>, <em>em</em> and <code>code</code> with <a href="https://example.com/a?b=1&amp;c=2" title="T" target="_blank" class="x" id="y">a link</a>.</p><ul><li>one</li><li>two</li></ul>',
      ),
    ).toBe(
      '<h5>Title</h5><p>Some <strong>bold</strong>, <em>em</em> and <code>code</code> with <a href="https://example.com/a?b=1&amp;c=2" title="T" rel="noopener noreferrer nofollow">a link</a>.</p><ul><li>one</li><li>two</li></ul>',
    );
  });

  it("escapes text, so decoded markup stays text", () => {
    expect(sanitizeHtml("a &lt;b&gt; &amp; &quot;c&quot; &#60;i&#62;")).toBe(
      "a &lt;b&gt; &amp; &quot;c&quot; &lt;i&gt;",
    );
    expect(sanitizeHtml("1 < 2 and 3 > 2")).toBe("1 &lt; 2 and 3 &gt; 2");
  });

  it("leaves an entity it does not know as the literal text", () => {
    expect(sanitizeHtml("&notanentity; &amp")).toBe(
      "&amp;notanentity; &amp;amp",
    );
  });

  it("decodes a numeric entity to its character, and bad ones to the replacement character", () => {
    expect(sanitizeHtml("&#233; &#x1F600; &#0; &#xD800; &#x110000;")).toBe(
      "é 😀 � � �",
    );
  });

  it("closes what is left open and ignores an end tag with no start", () => {
    expect(sanitizeHtml("<p>a<b>b</i></p>c</b>")).toBe("<p>a<b>b</b></p>c");
    expect(sanitizeHtml("<ul><li>a<li>b")).toBe(
      "<ul><li>a<li>b</li></li></ul>",
    );
  });

  it("writes void and self-closing tags once", () => {
    expect(sanitizeHtml("a<br>b<br/>c<hr>d")).toBe("a<br>b<br>c<hr>d");
    expect(sanitizeHtml("<b/>x")).toBe("<b></b>x");
  });

  it("unwraps a link without a safe href, and keeps a relative one by default", () => {
    expect(sanitizeHtml('<a href="javascript:x">t</a>')).toBe("t");
    expect(sanitizeHtml("<a>t</a>")).toBe("t");
    expect(sanitizeHtml('<a href="/docs#a">t</a>')).toBe(
      '<a href="/docs#a" rel="noopener noreferrer nofollow">t</a>',
    );
    expect(
      sanitizeHtml('<a href="/docs">t</a>', {
        allow: { allowRelative: false },
      }),
    ).toBe("t");
    expect(sanitizeHtml('<a href="//evil.example">t</a>')).toBe("t");
  });

  it("normalizes a link's URL to the parsed form", () => {
    expect(sanitizeHtml('<a href="HTTPS://EXAMPLE.com/A b">t</a>')).toBe("t");
    expect(sanitizeHtml('<a href="HTTPS://EXAMPLE.com/A">t</a>')).toBe(
      '<a href="https://example.com/A" rel="noopener noreferrer nofollow">t</a>',
    );
  });

  it("honors allow.tags, allow.attributes and allow.protocols", () => {
    const allow = {
      tags: ["a", "span", "img"],
      attributes: { a: ["href"], span: ["title", "class"], "*": ["lang"] },
      protocols: ["https", "tel"],
    };

    expect(
      sanitizeHtml(
        '<p lang="en"><span title="s" class="c" lang="fr" data-x="1">a</span><a href="tel:+1555">b</a><a href="http://x.com/">c</a><img src="https://x.com/i.png"></p>',
        { allow },
      ),
    ).toBe(
      '<span title="s" class="c" lang="fr">a</span><a href="tel:+1555" rel="noopener noreferrer nofollow">b</a>c<img>',
    );
  });

  it("cannot be told to allow a script, an event handler or a style", () => {
    const allow = {
      tags: ["script", "style", "iframe", "svg", "img", "p"],
      attributes: {
        "*": ["onclick", "onerror", "style", "srcdoc"],
        img: ["src", "onerror"],
      },
    };
    const output = sanitizeHtml(
      '<script>alert(1)</script><style>p{}</style><iframe src="https://x.com"></iframe><svg onload=alert(1)></svg><p onclick="x" style="color:red">t</p><img src="https://x.com/i.png" onerror="alert(1)">',
      { allow },
    );

    expect(output).toBe('<p>t</p><img src="https://x.com/i.png">');
  });

  it("never lets an allowed URL attribute carry a code URL", () => {
    const allow = {
      tags: ["img", "blockquote"],
      attributes: { img: ["src"], blockquote: ["cite"] },
    };

    expect(
      sanitizeHtml(
        '<img src="javascript:alert(1)"><blockquote cite="data:text/html,x">q</blockquote>',
        { allow },
      ),
    ).toBe("<img><blockquote>q</blockquote>");
  });

  it("escapes quotes in attribute values, so a value cannot close its attribute", () => {
    const output = sanitizeHtml(
      `<a href="/x" title='" onmouseover="alert(1)'>t</a>`,
    );

    expect(output).toBe(
      '<a href="/x" title="&quot; onmouseover=&quot;alert(1)" rel="noopener noreferrer nofollow">t</a>',
    );
  });

  it("keeps the first of a repeated attribute, as a browser does", () => {
    expect(sanitizeHtml('<a href="/a" href="/b">t</a>')).toBe(
      '<a href="/a" rel="noopener noreferrer nofollow">t</a>',
    );
  });

  it("unwraps tags nested past the depth limit and still balances the rest", () => {
    const input = `${"<b>".repeat(MAX_DEPTH + 40)}x${"</b>".repeat(MAX_DEPTH + 40)}`;
    const output = sanitizeHtml(input);

    expect(output).toBe(
      `${"<b>".repeat(MAX_DEPTH)}x${"</b>".repeat(MAX_DEPTH)}`,
    );
  });

  it("drops input past maxLength", () => {
    expect(sanitizeHtml("abcdef", { allow: { maxLength: 3 } })).toBe("abc");
    expect(sanitizeHtml(`${"a".repeat(1_000_000)}b`)).toBe(
      "a".repeat(1_000_000),
    );
  });

  it("accepts any value", () => {
    expect(sanitizeHtml(undefined)).toBe("");
    expect(sanitizeHtml(null)).toBe("");
    expect(sanitizeHtml(42)).toBe("42");
    expect(sanitizeHtml({ toString: () => "<b>x</b>" })).toBe("<b>x</b>");
  });
});

describe("htmlToText", () => {
  it("drops markup and script, decodes entities and breaks at blocks", () => {
    expect(
      htmlToText(
        "<h2>Title</h2><p>One &amp; two<br>three</p><script>x()</script><ul><li>a</li><li>b</li></ul>",
      ),
    ).toBe("Title\n\nOne & two\nthree\n\na\nb");
  });

  it("leaves no tag behind in a nested-tag trick", () => {
    expect(
      htmlToText("<scr<script>ipt>alert(1)</scr</script>ipt>"),
    ).not.toMatch(/<script/i);
  });

  it("returns text, so a lone `<` in it is a character for the renderer to escape", () => {
    expect(htmlToText("<<b>b>text</<b>b>")).toBe("<b>textb>");
  });

  it("returns text that is the same however the whitespace was written", () => {
    expect(htmlToText("<p>a \n\t b</p>")).toBe("a b");
  });
});

describe("sanitizeHtml hang and fuzz", () => {
  const PIECES = [
    "<",
    ">",
    "</",
    "/>",
    "<a ",
    "<a href=",
    '"',
    "'",
    "=",
    "&",
    "&#",
    "&amp;",
    ";",
    "<!--",
    "-->",
    "<script>",
    "</script>",
    "<style>",
    "<svg>",
    "</svg>",
    "<p>",
    "<b>",
    "</b>",
    "<br>",
    "javascript:",
    "onerror=",
    " ",
    "x",
    "\x00",
  ];

  it("never throws, and always yields markup that holds no active content", () => {
    const next = seeded(31);

    for (let i = 0; i < 4000; i++) {
      const input =
        i % 2
          ? tokenSoup(next, PIECES, 1 + Math.floor(next() * 20))
          : randomString(next, Math.floor(next() * 60), "<>/\"'=&;!-ab \x00");
      const output = sanitizeHtml(input);

      expectNoActiveContent(output);
      expect(sanitizeHtml(output)).toBe(output);
      htmlToText(input);
    }
  });

  it("handles every prefix and suffix of a long document", () => {
    const sample =
      '<p class="x">Hi <a href="https://example.com/a?b=1&amp;c=2" onclick="x()">link</a><script>alert(1)</script><!-- c --><img src=x onerror=alert(1)><b>bold</b> &amp; &#169;</p>';

    expectWithin(3000, () => {
      for (const part of prefixesAndSuffixes(sample)) {
        sanitizeHtml(part);
        htmlToText(part);
      }
    });
  });

  const MB = 1024 * 1024;
  const SHAPES: Array<[string, string]> = [
    ["plain text", "lorem ipsum ".repeat(MB / 12)],
    ["less-than signs", "<".repeat(MB)],
    ["open tags", "<b>".repeat(MB / 3)],
    ["close tags", "</b>".repeat(MB / 4)],
    ["unmatched closers", "</p></b></i>".repeat(MB / 12)],
    ["tag starts", "<a ".repeat(MB / 3)],
    ["attributes", `<a ${"x=1 ".repeat(MB / 4)}>`],
    ["quotes", `<a href="${'"'.repeat(MB)}`],
    ["equals signs", `<a ${"=".repeat(MB)}>`],
    ["slashes", `<a ${"/".repeat(MB)}>`],
    ["ampersands", "&".repeat(MB)],
    ["entities", "&#x".repeat(MB / 3)],
    ["entities with semicolons", "&a;".repeat(MB / 3)],
    ["comments", "<!--".repeat(MB / 4)],
    ["comment openers with endings", "<!-- -->".repeat(MB / 8)],
    ["scripts", "<script>".repeat(MB / 8)],
    ["scripts with ends", "<script></script>".repeat(MB / 17)],
    ["script end tags", `<script>${"</scrip".repeat(MB / 7)}`],
    ["svg openers", "<svg>".repeat(MB / 5)],
    ["svg pairs", "<svg></svg>".repeat(MB / 11)],
    ["links", '<a href="http://a.co">x</a>'.repeat(MB / 27)],
    ["br", "<br>".repeat(MB / 4)],
    ["spaces", " ".repeat(MB)],
    ["newlines in text", "a\n".repeat(MB / 2)],
    ["empty inline tags between spaces", "<b></b> ".repeat(MB / 8)],
    ["deep nesting", `${"<div><b>".repeat(MB / 8)}x`],
  ];

  it.each(SHAPES)("reads 1 MB of %s in under a second", (_name, input) => {
    expect(input.length).toBeGreaterThan(MB * 0.7);
    expectWithin(1200, () => {
      sanitizeHtml(input);
    });
    expectWithin(1200, () => {
      htmlToText(input);
    });
  });
});
