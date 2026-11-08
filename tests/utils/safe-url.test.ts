import {
  displayHost,
  displayHref,
  linkLabel,
  safeUrl,
  stripBidi,
} from "../../src/utils/safe-url.js";
import {
  expectWithin,
  prefixesAndSuffixes,
  randomString,
  seeded,
  tokenSoup,
} from "./fuzz";

// URL vectors from the OWASP XSS Filter Evasion Cheat Sheet and the
// WHATWG URL parser's habits, as they would arrive in an href.
const BLOCKED: Array<[string, string]> = [
  ["plain", "javascript:alert('XSS')"],
  ["mixed case", "JaVaScRiPt:alert(1)"],
  ["upper case", "JAVASCRIPT:alert(1)"],
  ["leading space", "   javascript:alert(1)"],
  ["leading tab and newline", "\t\njavascript:alert(1)"],
  ["leading C0 control", "\x01javascript:alert(1)"],
  ["leading NUL", "\x00javascript:alert(1)"],
  ["leading form feed", "\x0cjavascript:alert(1)"],
  ["embedded tab", "java\tscript:alert(1)"],
  ["embedded newline", "java\nscript:alert(1)"],
  ["embedded carriage return", "java\rscript:alert(1)"],
  ["tab, newline and CR", "j\ta\nv\ra\tscript:alert(1)"],
  ["embedded NUL", "java\x00script:alert(1)"],
  ["embedded C0 control", "java\x01script:alert(1)"],
  ["zero-width space", "java​script:alert(1)"],
  ["zero-width joiner", "javascript‍:alert(1)"],
  ["BOM", "﻿javascript:alert(1)"],
  ["line separator", " javascript:alert(1)"],
  ["no-break space", " javascript:alert(1)"],
  ["right-to-left override", "‮javascript:alert(1)"],
  ["space before colon", "javascript :alert(1)"],
  ["slashes after colon", "javascript://%0aalert(1)"],
  ["comment trick", "javascript://example.com/%0Aalert(1)"],
  ["encoded payload", "javascript:alert(String.fromCharCode(88,83,83))"],
  ["vbscript", "vbscript:msgbox(1)"],
  ["vbscript mixed case", "VbScRiPt:msgbox(1)"],
  ["livescript", "livescript:alert(1)"],
  ["data html", "data:text/html,<script>alert(1)</script>"],
  [
    "data html base64",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
  ],
  ["data svg", "data:image/svg+xml,<svg onload=alert(1)>"],
  ["data mixed case", "DaTa:text/html,x"],
  ["data with tab", "da\tta:text/html,x"],
  ["file", "file:///etc/passwd"],
  ["blob", "blob:https://example.com/uuid"],
  ["about", "about:blank"],
  ["ftp", "ftp://example.com/x"],
  ["intent", "intent://scan/#Intent;scheme=zxing;end"],
  ["custom app scheme", "slack://open"],
  ["credentials", "https://user:pass@example.com/"],
  ["credentials, user only", "https://admin@example.com/"],
  ["phishing credentials", "https://google.com@evil.example/"],
  ["protocol-relative", "//evil.example/x"],
  ["backslash pair", "\\\\evil.example/x"],
  ["slash backslash", "/\\evil.example/x"],
  ["backslash slash", "\\/evil.example/x"],
  ["tab splits slashes", "/\t/evil.example"],
  ["no host", "http://"],
  ["http no host with path", "http:///"],
  ["relative path", "/docs"],
  ["fragment", "#top"],
  ["bare word", "example"],
  ["empty", ""],
  ["spaces only", "   "],
  ["space inside", "https://example.com/a b"],
  ["newline inside after trim", "https://exa mple.com"],
  ["unicode space inside", "https://example.com/a　b"],
  ["too long", `https://example.com/${"a".repeat(9000)}`],
];

describe("safeUrl vectors", () => {
  it.each(BLOCKED)("refuses %s", (_name, url) => {
    expect(safeUrl(url)).toBeNull();
  });

  it.each(
    BLOCKED.filter(([, url]) => /^[^a-z]*(java|vb|live|data)/i.test(url)),
  )("refuses %s even with relative URLs allowed", (_name, url) => {
    expect(safeUrl(url, { allowRelative: true })).toBeNull();
  });

  it("treats a fullwidth colon as a relative path, which stays on the site", () => {
    const url = "javascript：alert(1)";

    expect(safeUrl(url)).toBeNull();
    const result = safeUrl(url, { allowRelative: true });
    expect(new URL(result as string, "https://example.com/").protocol).toBe(
      "https:",
    );
  });

  it("refuses non-string input", () => {
    for (const value of [undefined, null, 0, {}, [], ["https://a.com"], true]) {
      expect(safeUrl(value)).toBeNull();
    }
  });

  it("refuses javascript:, vbscript: and data: even when listed", () => {
    const protocols = ["javascript", "vbscript:", "data", "https"];

    expect(safeUrl("javascript:alert(1)", { protocols })).toBeNull();
    expect(safeUrl("vbscript:x", { protocols })).toBeNull();
    expect(safeUrl("data:text/plain,hi", { protocols })).toBeNull();
    expect(safeUrl("https://example.com", { protocols })).toBe(
      "https://example.com/",
    );
  });
});

describe("safeUrl accepted URLs", () => {
  it.each([
    ["http://example.com", "http://example.com/"],
    ["HTTPS://EXAMPLE.COM/Path?Q=1#Frag", "https://example.com/Path?Q=1#Frag"],
    ["  https://example.com/a  ", "https://example.com/a"],
    ["https://exa\tmple.com/\n", "https://example.com/"],
    ["mailto:me@example.com", "mailto:me@example.com"],
    ["MAILTO:me@example.com?subject=Hi", "mailto:me@example.com?subject=Hi"],
    ["http://[::1]:8080/x", "http://[::1]:8080/x"],
    ["http://127.0.0.1/", "http://127.0.0.1/"],
    ["https://example.com/a(b)", "https://example.com/a(b)"],
    [
      "https://example.com/日本語",
      "https://example.com/%E6%97%A5%E6%9C%AC%E8%AA%9E",
    ],
  ])("returns %j as %j", (url, expected) => {
    expect(safeUrl(url)).toBe(expected);
  });

  it("returns the parser's form, so the rendered URL is the checked URL", () => {
    // A browser reads `http:\\host` as `http://host`; so does the result.
    expect(safeUrl("http:\\\\example.com\\x")).toBe("http://example.com/x");
    expect(safeUrl("http:example.com")).toBe("http://example.com/");
  });

  it("turns an internationalized host into punycode", () => {
    expect(safeUrl("https://bücher.de/")).toBe("https://xn--bcher-kva.de/");
    expect(safeUrl("https://аррӏе.com/")).toBe("https://xn--80ak6aa92e.com/");
  });

  it("takes schemes with or without a colon", () => {
    expect(safeUrl("tel:+15550100", { protocols: ["tel:"] })).toBe(
      "tel:+15550100",
    );
    expect(safeUrl("tel:+15550100", { protocols: ["tel"] })).toBe(
      "tel:+15550100",
    );
    expect(safeUrl("tel:+15550100")).toBeNull();
    expect(safeUrl("https://a.com", { protocols: ["mailto"] })).toBeNull();
  });

  it("allows credentials only when asked", () => {
    expect(
      safeUrl("https://user:pass@example.com/", { allowCredentials: true }),
    ).toBe("https://user:pass@example.com/");
  });

  it("allows relative URLs only when asked, and never off-site ones", () => {
    const options = { allowRelative: true };

    expect(safeUrl("/docs?a=1", options)).toBe("/docs?a=1");
    expect(safeUrl("../up", options)).toBe("../up");
    expect(safeUrl("#top", options)).toBe("#top");
    expect(safeUrl("?q=1", options)).toBe("?q=1");
    expect(safeUrl("page.html", options)).toBe("page.html");
    expect(safeUrl("//evil.example", options)).toBeNull();
    expect(safeUrl("\\\\evil.example", options)).toBeNull();
    expect(safeUrl("/\\evil.example", options)).toBeNull();
    expect(safeUrl("/\t/evil.example", options)).toBeNull();
    expect(safeUrl("javascript:alert(1)", options)).toBeNull();
  });

  it("honors maxLength", () => {
    const url = `https://example.com/${"a".repeat(30)}`;

    expect(safeUrl(url, { maxLength: 40 })).toBeNull();
    expect(safeUrl(url, { maxLength: 100 })).toBe(url);
  });
});

describe("stripBidi", () => {
  it("removes override, embedding, isolate and mark characters", () => {
    expect(stripBidi("a‮b‪c⁦d⁩e‎f‏g؜h")).toBe("abcdefgh");
    expect(stripBidi(undefined)).toBe("");
  });
});

describe("displayHost", () => {
  it.each([
    ["Cyrillic lookalike of apple", "xn--80ak6aa92e.com", "xn--80ak6aa92e.com"],
    ["Cyrillic typed in Unicode", "аррӏе.com", "xn--80ak6aa92e.com"],
    ["Greek lookalike", "xn--mxa3b.com", "xn--mxa3b.com"],
    ["mixed Latin and Cyrillic", "xn--pple-43d.com", "xn--pple-43d.com"],
    ["Latin with a diacritic", "xn--bcher-kva.de", "bücher.de"],
    ["Han and Hiragana", "xn--r8jz45g.jp", "例え.jp"],
    ["Hangul", "xn--bj0bj06e.kr", "한글.kr"],
    ["Arabic", "xn--mgbh0fb.com", "مثال.com"],
    ["ASCII", "Example.COM", "example.com"],
    ["malformed punycode", "xn--9999999999.com", "xn--9999999999.com"],
    ["not a string", undefined, ""],
  ])("%s", (_name, host, expected) => {
    expect(displayHost(host)).toBe(expected);
  });

  it("shows the punycode of an IPA lookalike for g", () => {
    // U+0261 LATIN SMALL LETTER SCRIPT G looks like g.
    expect(displayHost("ɡoogle.com")).toBe("xn--oogle-qmc.com");
  });

  it("shows the punycode of a dotless i", () => {
    expect(displayHost("ıcloud.com")).toMatch(/^xn--/);
  });
});

describe("displayHref", () => {
  it("shows the real host, path and query", () => {
    expect(displayHref("https://www.example.com:8443/a/b?x=1")).toBe(
      "www.example.com:8443/a/b?x=1",
    );
    expect(displayHref("https://example.com/")).toBe("example.com");
  });

  it("shows a lookalike host as punycode", () => {
    expect(displayHref("https://аррӏе.com/login")).toBe(
      "xn--80ak6aa92e.com/login",
    );
  });

  it("shows a mailto address with a safe domain", () => {
    expect(displayHref("mailto:me@example.com?subject=Hi")).toBe(
      "me@example.com",
    );
    expect(displayHref("mailto:me@xn--80ak6aa92e.com")).toBe(
      "me@xn--80ak6aa92e.com",
    );
  });

  it("cuts a long address with an ellipsis", () => {
    const shown = displayHref(`https://example.com/${"a".repeat(200)}`);

    expect(shown).toHaveLength(80);
    expect(shown.endsWith("…")).toBe(true);
  });

  it("returns an empty string for what is not a URL", () => {
    expect(displayHref("not a url")).toBe("");
    expect(displayHref(null)).toBe("");
  });
});

describe("linkLabel", () => {
  it("flags text that names another site", () => {
    const label = linkLabel(
      "https://paypal.com/login",
      "https://evil.example/",
    );

    expect(label.mismatch).toBe(true);
    expect(label.display).toBe("evil.example");
  });

  it.each([
    ["a bare host", "paypal.com"],
    ["www host", "www.paypal.com"],
    ["a host in a sentence", "Sign in at paypal.com now"],
    ["a host with a port", "paypal.com:443/login"],
    ["a host inside brackets", "(paypal.com)"],
    ["credentials trick", "https://paypal.com@evil.example"],
  ])("flags %s", (_name, text) => {
    expect(linkLabel(text, "https://evil.example/").mismatch).toBe(true);
  });

  it.each([
    ["the same host", "https://example.com/a", "https://example.com/b"],
    ["with and without www", "www.example.com", "https://example.com/"],
    ["different case", "EXAMPLE.com", "https://example.com/"],
    ["plain words", "Click here", "https://example.com/"],
    ["an abbreviation", "e.g. this one", "https://example.com/"],
    ["a version number", "v1.2", "https://example.com/"],
    ["an email on the same domain", "me@example.com", "mailto:me@example.com"],
  ])("accepts %s", (_name, text, href) => {
    expect(linkLabel(text, href).mismatch).toBe(false);
  });

  it("flags a Unicode lookalike of the host it links to", () => {
    expect(
      linkLabel("https://аррӏе.com/", "https://xn--80ak6aa92e.com/").mismatch,
    ).toBe(true);
  });

  it("accepts a Unicode host that displays as Unicode", () => {
    expect(
      linkLabel("https://bücher.de/", "https://xn--bcher-kva.de/").mismatch,
    ).toBe(false);
  });

  it("strips bidi controls that reorder the text", () => {
    expect(linkLabel("‮evil.example", "https://evil.example/").text).toBe(
      "evil.example",
    );
  });

  it("reads a claim after a very long run of text", () => {
    const text = `${"a ".repeat(40)}paypal.com`;

    // Only 32 words are read, so the claim is beyond the limit; it must not
    // hang or throw.
    expect(() => linkLabel(text, "https://evil.example/")).not.toThrow();
  });
});

describe("safe-url hang and fuzz", () => {
  const PIECES = [
    "javascript:",
    "java\tscript:",
    "http://",
    "https://",
    "mailto:",
    "//",
    "\\",
    "/",
    ":",
    "@",
    ".",
    "xn--",
    "a",
    "0",
    " ",
    "\t",
    "‮",
    "​",
    "%",
    "[",
    "]",
    "é",
    "日",
  ];

  it("never throws, and returns a string or null, for random input", () => {
    const next = seeded(14);

    for (let i = 0; i < 3000; i++) {
      const input =
        i % 2
          ? tokenSoup(next, PIECES, 1 + Math.floor(next() * 12))
          : randomString(
              next,
              Math.floor(next() * 40),
              "ab:/.\\ \t\n\u0000é日@[]%",
            );
      const result = safeUrl(input, { allowRelative: i % 3 === 0 });

      expect(result === null || typeof result === "string").toBe(true);
      displayHost(input);
      displayHref(input);
      linkLabel(input, "https://example.com/");
    }
  });

  it("only returns URLs that a browser resolves to http, https or mailto", () => {
    const next = seeded(15);
    const base = "https://example.com/dir/";

    for (let i = 0; i < 6000; i++) {
      const input = tokenSoup(next, PIECES, 1 + Math.floor(next() * 10));
      const result = safeUrl(input, { allowRelative: true });
      if (result === null) continue;
      const resolved = new URL(result, base);

      expect(["http:", "https:", "mailto:"]).toContain(resolved.protocol);
      // A relative result never leaves the page's site.
      if (!/^[a-z][a-z0-9+.-]*:/i.test(result)) {
        expect(resolved.origin).toBe("https://example.com");
      }
    }
  });

  it("handles every prefix and suffix of a long URL", () => {
    const sample = "https://user:pw@bücher.example.com:8080/a/(b)?q=1&r=2#frag";

    expectWithin(2000, () => {
      for (const part of prefixesAndSuffixes(sample)) {
        safeUrl(part);
        displayHref(part);
        linkLabel(part, sample);
      }
    });
  });

  it.each([
    ["spaces", " ".repeat(1_000_000)],
    ["tabs then text", `${"\t".repeat(500_000)}javascript:x`],
    ["trailing spaces", `https://a.com${" ".repeat(500_000)}`],
    ["colons", ":".repeat(500_000)],
    ["slashes", "/".repeat(500_000)],
    ["dots", "a.".repeat(250_000)],
    ["scheme-like", `${"a".repeat(500_000)}:`],
    ["at signs", "@".repeat(500_000)],
    ["bidi controls", "‮".repeat(500_000)],
    ["brackets", `http://${"[".repeat(250_000)}`],
  ])("finishes quickly on 500,000 or more characters of %s", (_name, input) => {
    expectWithin(1500, () => {
      safeUrl(input);
      safeUrl(input, { allowRelative: true });
      displayHost(input);
      displayHref(input);
      linkLabel(input, "https://example.com/");
    });
  });

  it("finishes quickly on a 1,000,000-character host with many labels", () => {
    expectWithin(1500, () => {
      displayHost(`${"a.".repeat(500_000)}com`);
      displayHost(`${"xn--a.".repeat(100_000)}com`);
    });
  });
});
