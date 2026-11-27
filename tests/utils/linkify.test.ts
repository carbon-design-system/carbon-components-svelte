// @vitest-environment node
import { linkify } from "../../src/utils/linkify.js";
import {
  expectLinear,
  expectWithin,
  prefixesAndSuffixes,
  randomString,
  seeded,
  tokenSoup,
} from "./fuzz";

const links = (text: string, options?: Parameters<typeof linkify>[1]) =>
  linkify(text, options)
    .filter((segment) => segment.type === "link")
    .map((segment) => segment.text);

describe("linkify", () => {
  it("splits text around links, and the parts join back to the text", () => {
    const text =
      "Track it at https://ship.example.com/t/1Z9 or mail help@x.co now";
    const segments = linkify(text);

    expect(segments).toEqual([
      { type: "text", text: "Track it at " },
      {
        type: "link",
        text: "https://ship.example.com/t/1Z9",
        href: "https://ship.example.com/t/1Z9",
      },
      { type: "text", text: " or mail " },
      { type: "link", text: "help@x.co", href: "mailto:help@x.co" },
      { type: "text", text: " now" },
    ]);
    expect(segments.map((segment) => segment.text).join("")).toBe(text);
  });

  it("returns one text segment when there is nothing to link, and none for empty input", () => {
    expect(linkify("just words")).toEqual([
      { type: "text", text: "just words" },
    ]);
    expect(linkify("")).toEqual([]);
    expect(linkify(undefined)).toEqual([]);
    expect(linkify(null)).toEqual([]);
  });

  describe("trailing punctuation", () => {
    it.each([
      [
        "a full stop",
        "See https://example.com/docs.",
        "https://example.com/docs",
      ],
      ["a comma", "https://example.com/a, then", "https://example.com/a"],
      [
        "a question mark",
        "Is it https://example.com/a?",
        "https://example.com/a",
      ],
      [
        "an exclamation mark",
        "Go https://example.com/a!",
        "https://example.com/a",
      ],
      ["a colon", "At https://example.com/a: yes", "https://example.com/a"],
      ["a semicolon", "https://example.com/a; and", "https://example.com/a"],
      ["several marks", "https://example.com/a?!.", "https://example.com/a"],
      ["a quote", "He said 'https://example.com/a'", "https://example.com/a"],
      [
        "a double quote",
        'He said "https://example.com/a"',
        "https://example.com/a",
      ],
      ["angle brackets", "<https://example.com/a>", "https://example.com/a"],
    ])("leaves out %s", (_name, text, expected) => {
      expect(links(text)).toEqual([expected]);
    });

    it("keeps a query that ends in a question-mark-free value", () => {
      expect(links("https://example.com/a?b=c.")).toEqual([
        "https://example.com/a?b=c",
      ]);
    });
  });

  describe("brackets", () => {
    it.each([
      [
        "a bracket the URL opened",
        "https://en.wikipedia.org/wiki/Svelte_(software)",
        "https://en.wikipedia.org/wiki/Svelte_(software)",
      ],
      [
        "an enclosing bracket",
        "(see https://example.com/a)",
        "https://example.com/a",
      ],
      [
        "an enclosing bracket and a full stop",
        "(see https://example.com/a).",
        "https://example.com/a",
      ],
      [
        "own and enclosing brackets",
        "(https://en.wikipedia.org/wiki/Svelte_(software)).",
        "https://en.wikipedia.org/wiki/Svelte_(software)",
      ],
      ["square brackets", "[https://example.com/a]", "https://example.com/a"],
      [
        "an IPv6 host",
        "http://[2001:db8::1]:8080/x",
        "http://[2001:db8::1]:8080/x",
      ],
    ])("balances %s", (_name, text, expected) => {
      expect(links(text)).toEqual([expected]);
    });
  });

  describe("what becomes a link", () => {
    it("links www hosts over https, with the text as typed", () => {
      expect(linkify("Visit www.Example.com/a.")).toEqual([
        { type: "text", text: "Visit " },
        {
          type: "link",
          text: "www.Example.com/a",
          href: "https://www.example.com/a",
        },
        { type: "text", text: "." },
      ]);
    });

    it.each([
      ["a bare host", "visit example.com now"],
      ["a file name", "open index.html or www.txt"],
      ["a lone www", "www. and www.com"],
      ["www in a word", "awww.example.com"],
      ["www after a dot", "foo.www.example.com"],
      ["a version", "v1.2.3"],
    ])("leaves %s as text", (_name, text) => {
      expect(links(text)).toEqual([]);
    });

    it("links mailto: and tel: without slashes when they are allowed", () => {
      expect(links("mail mailto:a@b.co?subject=Hi now")).toEqual([
        "mailto:a@b.co?subject=Hi",
      ]);
      expect(links("Call tel:+15550100 now", { protocols: ["tel:"] })).toEqual([
        "tel:+15550100",
      ]);
      expect(links("Call tel:+15550100 now")).toEqual([]);
    });

    it("links email addresses unless asked not to", () => {
      expect(links("a.b+c@sub.example.co.uk, hi")).toEqual([
        "a.b+c@sub.example.co.uk",
      ]);
      expect(links("a@b.co", { emails: false })).toEqual([]);
      expect(links("a@b.co", { protocols: ["https"] })).toEqual([]);
    });

    it.each([
      ["no domain dot", "me@localhost"],
      ["a one-letter TLD", "me@example.c"],
      ["a numeric TLD", "me@example.123"],
      ["a leading dot", ".me@example.com x"],
      ["a double dot", "m..e@example.com"],
      ["an at sign alone", "@ and @@ and a@"],
      ["a mention", "@handle and @org/team"],
      ["a hyphen-led label", "me@-example.com"],
    ])("leaves %s as text", (_name, text) => {
      const found = links(text);

      // `.me@example.com` is the one case that may still link its tail.
      expect(found.filter((found) => found !== "me@example.com")).toEqual([]);
    });

    it("leaves a sentence-ending dot out of an email", () => {
      expect(links("write to me@example.com.")).toEqual(["me@example.com"]);
    });

    it("does not link an email inside a URL", () => {
      expect(links("https://example.com/@user@host.com")).toEqual([
        "https://example.com/@user@host.com",
      ]);
    });

    it("links each of several URLs", () => {
      expect(links("a http://a.com b https://b.com/x c www.c.org")).toEqual([
        "http://a.com",
        "https://b.com/x",
        "www.c.org",
      ]);
    });

    it("is not case sensitive about the scheme", () => {
      expect(linkify("HTTPS://EXAMPLE.COM/A")).toEqual([
        {
          type: "link",
          text: "HTTPS://EXAMPLE.COM/A",
          href: "https://example.com/A",
        },
      ]);
    });
  });

  describe("what stays text", () => {
    it.each([
      ["javascript", "click javascript://%0aalert(1) now"],
      ["javascript, upper case", "JAVASCRIPT://x"],
      ["vbscript", "vbscript://x"],
      ["data", "data://text/html,hi"],
      ["file", "file:///etc/passwd"],
      ["ftp", "ftp://example.com/x"],
      ["credentials", "https://user:pass@example.com/"],
      ["phishing credentials", "https://google.com@evil.example/"],
      ["a scheme with no host", "http:// and https://"],
      ["a scheme glued to a word", "xhttps://example.com"],
      ["a digit-led scheme", "1http://example.com"],
    ])("%s", (_name, text) => {
      expect(links(text)).toEqual([]);
    });

    it("never links javascript:, vbscript: or data: even when listed", () => {
      const protocols = ["javascript", "vbscript", "data", "https"];

      expect(
        links("javascript://x vbscript://x data://x", { protocols }),
      ).toEqual([]);
    });

    it("leaves a candidate longer than maxLength as text", () => {
      const url = `https://example.com/${"a".repeat(100)}`;

      expect(links(url, { maxLength: 50 })).toEqual([]);
      expect(links(url, { maxLength: 500 })).toEqual([url]);
    });
  });

  describe("scripts and directions", () => {
    it("ends a URL at CJK punctuation and at a space", () => {
      expect(links("请访问 https://example.com/a。然后")).toEqual([
        "https://example.com/a",
      ]);
      expect(links("詳細はhttps://example.com/a、こちら")).toEqual([
        "https://example.com/a",
      ]);
    });

    it("keeps non-ASCII characters in a path", () => {
      expect(links("https://ja.wikipedia.org/wiki/日本 を見て")).toEqual([
        "https://ja.wikipedia.org/wiki/日本",
      ]);
    });

    it("finds a URL in Hebrew and Arabic text, without the surrounding words", () => {
      expect(links("שלום https://example.com/a. מה שלומך")).toEqual([
        "https://example.com/a",
      ]);
      expect(links("مرحبا https://example.com/ا هذا")).toEqual([
        "https://example.com/ا",
      ]);
    });

    it("ends a URL at a bidi control, so no override hides inside a link", () => {
      expect(links("https://example.com/a‮gnp.exe more")).toEqual([
        "https://example.com/a",
      ]);
      expect(links("https://example.com/a⁦b")).toEqual([
        "https://example.com/a",
      ]);
      expect(links("https://example.com/a​b")).toEqual([
        "https://example.com/a",
      ]);
    });

    it("keeps the href in punycode for an internationalized host", () => {
      expect(linkify("https://аррӏе.com/x")).toEqual([
        {
          type: "link",
          text: "https://аррӏе.com/x",
          href: "https://xn--80ak6aa92e.com/x",
        },
      ]);
    });
  });
});

describe("linkify hang and fuzz", () => {
  const PIECES = [
    "http://",
    "https://",
    "www.",
    "mailto:",
    "javascript:",
    "a",
    "b.c",
    "@",
    ".",
    ",",
    "(",
    ")",
    "[",
    "]",
    ":",
    "/",
    " ",
    "\n",
    "<",
    "‮",
    "日",
    "。",
    "é",
  ];

  it("never throws, and the segments always join back to the input", () => {
    const next = seeded(21);

    for (let i = 0; i < 4000; i++) {
      const input =
        i % 2
          ? tokenSoup(next, PIECES, 1 + Math.floor(next() * 16))
          : randomString(next, Math.floor(next() * 60), "ab:/.@()[] \n‮日");
      const segments = linkify(input);

      expect(segments.map((segment) => segment.text).join("")).toBe(input);
      for (let s = 0; s < segments.length; s++) {
        const segment = segments[s];
        if (segment.type === "text") {
          expect(segment.text).not.toBe("");
          // Adjacent text is one segment.
          expect(segments[s + 1]?.type).not.toBe("text");
        } else {
          expect(segment.href).toMatch(/^(https?:|mailto:)/);
        }
      }
    }
  });

  it("only links hrefs that a browser would not run", () => {
    const next = seeded(22);

    for (let i = 0; i < 4000; i++) {
      const input = tokenSoup(next, PIECES, 1 + Math.floor(next() * 14));
      for (const segment of linkify(input)) {
        if (segment.type === "link") {
          expect(["http:", "https:", "mailto:"]).toContain(
            new URL(segment.href).protocol,
          );
        }
      }
    }
  });

  it("handles every prefix and suffix of a realistic message", () => {
    const sample =
      "Hi (see https://en.wikipedia.org/wiki/Svelte_(software)), mail me@example.com or www.example.co.uk/a?b=c.";

    expectWithin(2000, () => {
      for (const part of prefixesAndSuffixes(sample)) linkify(part);
    });
  });

  const MB = 1024 * 1024;
  /** `unit` repeated to `size` characters, after `prefix`. */
  const fill =
    (unit: string, prefix = "") =>
    (size: number) =>
      prefix + unit.repeat(Math.ceil(size / unit.length));
  const SHAPES: Array<[string, (size: number) => string]> = [
    ["plain text", fill("lorem ipsum dolor sit amet ")],
    ["one letter", fill("a")],
    ["dots between letters", fill("a.")],
    ["colons", fill(":")],
    ["scheme separators", fill("http://")],
    ["scheme separators, no space", fill("https://a.b")],
    ["bare schemes", fill("a:")],
    ["URLs that end in a paren", fill("http://a)")],
    ["one long URL", fill("a", "https://example.com/")],
    ["one long URL of parens", fill(")", "http://a")],
    ["one long URL of open parens", fill("(", "http://a")],
    ["trailing punctuation", fill(".", "http://a")],
    ["trailing punctuation mix", fill(".,;:!?'", "http://a")],
    ["www", fill("www.")],
    ["www with hosts", fill("www.a.co ")],
    ["at signs", fill("@")],
    ["emails", fill("a@b.co ")],
    ["email shaped, never valid", fill("a@b")],
    ["long local parts", fill(`${"a".repeat(60)}@`)],
    ["long domains", fill(`a@${"b".repeat(250)}`)],
    ["email dots", fill("a@b.")],
    ["mailto", fill("mailto:")],
    ["brackets", fill("[(")],
    ["spaces", fill(" ")],
    ["newlines", fill("\n")],
    ["bidi controls", fill("‮")],
    [
      "mixed soup",
      (size) =>
        tokenSoup(
          seeded(5),
          ["http://", "a", ".", "(", ")", "@", " ", "www."],
          Math.ceil(size / 3),
        ),
    ],
  ];

  // Count the characters read, not the time, so load can't fail it. One
  // run takes about 0.3 s; the timeout is only there to stop a hang the
  // count can't see, so it leaves room for a loaded machine.
  it.each(SHAPES)(
    "reads 1 MB of %s in linear time",
    (_name, build) => {
      expect(build(MB).length).toBeGreaterThan(MB * 0.7);
      expectLinear(build, (input) => linkify(input), MB);
    },
    30_000,
  );
});
