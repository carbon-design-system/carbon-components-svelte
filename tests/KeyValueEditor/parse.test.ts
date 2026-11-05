import {
  detectSyntax,
  parseDotenv,
  parseHeaders,
  parseJson,
  parseKeyValue,
  serializeDotenv,
  serializeHeaders,
  serializeJson,
  serializeKeyValue,
} from "carbon-components-svelte/KeyValueEditor/parse.js";

const pairs = (text: string, parse = parseDotenv) =>
  parse(text).entries.map(({ key, value }) => [key, value]);

describe("parseDotenv", () => {
  it.each([
    ["a plain pair", "A=1", [["A", "1"]]],
    ["export prefix", "export A=1", [["A", "1"]]],
    ["export with tab", "export\tA=1", [["A", "1"]]],
    ["a key named export", "export=1", [["export", "1"]]],
    ["spaces around =", "A = 1", [["A", "1"]]],
    ["empty value", "A=", [["A", ""]]],
    ["= in the value", "A=b=c==", [["A", "b=c=="]]],
    ["blank lines and comments", "\n# c\n  # d\nA=1\n\n", [["A", "1"]]],
    ["inline comment", "A=1 # note", [["A", "1"]]],
    [
      "# without a space is data",
      "A=http://x/#frag",
      [["A", "http://x/#frag"]],
    ],
    ["comment right after =", "A= # nothing", [["A", ""]]],
    ["# at the start of the value", "A=#fff", [["A", "#fff"]]],
    ["double quotes keep spaces", 'A="  x  "', [["A", "  x  "]]],
    ["double quote escapes", 'A="a\\nb\\t\\"c\\\\d"', [["A", 'a\nb\t"c\\d']]],
    ["unknown escape is kept", 'A="a\\qb"', [["A", "a\\qb"]]],
    ["single quotes are literal", "A='a\\nb $X'", [["A", "a\\nb $X"]]],
    ["backticks", "A=`a \"b\" 'c'`", [["A", "a \"b\" 'c'"]]],
    ["comment after a quote", 'A="x" # c', [["A", "x"]]],
    ["# inside quotes", 'A="x # y"', [["A", "x # y"]]],
    [
      "CRLF",
      "A=1\r\nB=2\r\n",
      [
        ["A", "1"],
        ["B", "2"],
      ],
    ],
    [
      "lone CR",
      "A=1\rB=2",
      [
        ["A", "1"],
        ["B", "2"],
      ],
    ],
    ["BOM", "﻿A=1", [["A", "1"]]],
    ["unicode", "ключ=значение", [["ключ", "значение"]]],
    ["dots and dashes in a key", "a.b-c=1", [["a.b-c", "1"]]],
  ])("reads %s", (_, text, expected) => {
    const result = parseDotenv(text);
    expect(result.errors).toEqual([]);
    expect(pairs(text)).toEqual(expected);
  });

  it("reads a quoted value over several lines, and keeps its indentation", () => {
    const result = parseDotenv(
      'KEY="-----BEGIN-----\n  abc\n-----END-----"\nNEXT=1',
    );
    expect(result.errors).toEqual([]);
    expect(result.entries.map((e) => e.value)).toEqual([
      "-----BEGIN-----\n  abc\n-----END-----",
      "1",
    ]);
    expect(result.entries[1].line).toBe(4);
  });

  it("reads CRLF inside a multi-line value as LF", () => {
    expect(pairs('A="x\r\ny"')).toEqual([["A", "x\ny"]]);
  });

  it("reports a line with no =, and keeps reading", () => {
    const result = parseDotenv("A=1\nnot a pair\nB=2");
    expect(result.errors).toEqual([{ line: 2, code: "no-separator" }]);
    expect(result.entries.map((e) => e.key)).toEqual(["A", "B"]);
  });

  it("reports an empty key", () => {
    expect(parseDotenv("=oops").errors).toEqual([
      { line: 1, code: "empty-key" },
    ]);
  });

  it("reports an unterminated quote on its own line and reads the lines after it", () => {
    const result = parseDotenv('A="never closed\nB=2');
    // The second line closes nothing, so the whole tail is unterminated; B is
    // inside the quote that never closes, so the parser starts again below.
    expect(result.errors).toEqual([{ line: 1, code: "unterminated-quote" }]);
    expect(result.entries).toEqual([{ key: "B", value: "2", line: 2 }]);
  });

  it("reports text after a closing quote", () => {
    const result = parseDotenv('A="x" y\nB=2');
    expect(result.errors).toEqual([{ line: 1, code: "trailing-characters" }]);
    expect(result.entries.map((e) => e.key)).toEqual(["B"]);
  });

  it("keeps a duplicate key; deciding what to do with it is validation's job", () => {
    expect(pairs("A=1\nA=2")).toEqual([
      ["A", "1"],
      ["A", "2"],
    ]);
  });

  it("reads a commented-out entry as disabled only when asked", () => {
    const text = "# A=1\n# some words\n#B=2\nC=3";
    expect(pairs(text)).toEqual([["C", "3"]]);
    const result = parseDotenv(text, { disabledComments: true });
    expect(result.entries).toEqual([
      { key: "A", value: "1", line: 1, enabled: false },
      { key: "B", value: "2", line: 3, enabled: false },
      { key: "C", value: "3", line: 4 },
    ]);
    expect(result.errors).toEqual([]);
  });

  it("stops at maxEntries and says so", () => {
    const result = parseDotenv("A=1\nB=2\nC=3", { maxEntries: 2 });
    expect(result.entries).toHaveLength(2);
    expect(result.truncated).toBe(true);
  });

  it("refuses text over maxLength without reading it", () => {
    const result = parseDotenv("A=1\n".repeat(10), { maxLength: 8 });
    expect(result.entries).toEqual([]);
    expect(result.errors).toEqual([{ line: 0, code: "too-large" }]);
  });

  describe("hostile input", () => {
    it("treats __proto__ and constructor as plain keys", () => {
      const result = parseDotenv("__proto__=x\nconstructor=y");
      expect(result.entries.map((e) => e.key)).toEqual([
        "__proto__",
        "constructor",
      ]);
      expect(({} as Record<string, unknown>).x).toBeUndefined();
    });

    it("reads a 300-line file with comments and multi-line values in under 50 ms", () => {
      const lines: string[] = [];
      for (let i = 0; i < 100; i++) {
        lines.push(`# section ${i}`, `KEY_${i}=value ${i}`);
        lines.push(`CERT_${i}="-----BEGIN-----\nabc\n-----END-----"`);
      }
      const text = lines.join("\n");
      expect(text.split("\n")).toHaveLength(500);
      const start = performance.now();
      const result = parseDotenv(text);
      expect(performance.now() - start).toBeLessThan(50);
      expect(result.entries).toHaveLength(200);
      expect(result.errors).toEqual([]);
    });

    it("does not go quadratic on many unterminated quotes", () => {
      const text = `${"A=x\n".repeat(3000)}B="${"\n".repeat(20000)}`;
      const start = performance.now();
      const result = parseDotenv(text);
      expect(performance.now() - start).toBeLessThan(500);
      expect(result.errors).toEqual([
        { line: 3001, code: "unterminated-quote" },
      ]);
    });

    it("survives a very long single line", () => {
      const result = parseDotenv(`A=${"x".repeat(900_000)}`);
      expect(result.entries[0].value).toHaveLength(900_000);
    });

    it("does not run away on a line of repeated quote and backslash characters", () => {
      const start = performance.now();
      parseDotenv(`A="${'\\"'.repeat(100_000)}`);
      parseDotenv(`A=${"='\"` #".repeat(50_000)}`);
      expect(performance.now() - start).toBeLessThan(500);
    });

    it("keeps control characters and NUL in the value", () => {
      expect(pairs("A=x\u0000y")).toEqual([["A", "x\u0000y"]]);
    });
  });
});

describe("parseHeaders", () => {
  it("splits at the first colon and trims", () => {
    expect(
      pairs(
        "Content-Type:  text/html; charset=utf-8 \nAuthorization: Bearer a:b==",
        parseHeaders,
      ),
    ).toEqual([
      ["Content-Type", "text/html; charset=utf-8"],
      ["Authorization", "Bearer a:b=="],
    ]);
  });

  it("joins an indented continuation line onto the line above", () => {
    expect(pairs("X-Long: one\n  two\n\tthree\nY: 1", parseHeaders)).toEqual([
      ["X-Long", "one two three"],
      ["Y", "1"],
    ]);
  });

  it("does not fold when the whole paste is indented", () => {
    expect(pairs("    A: 1\n    B: 2", parseHeaders)).toEqual([
      ["A", "1"],
      ["B", "2"],
    ]);
  });

  it("keeps a pseudo-header's leading colon", () => {
    expect(pairs(":authority: example.com", parseHeaders)).toEqual([
      [":authority", "example.com"],
    ]);
  });

  it("allows an empty value", () => {
    expect(pairs("X-Empty:", parseHeaders)).toEqual([["X-Empty", ""]]);
  });

  it("reports a status line and an empty name", () => {
    const result = parseHeaders("GET / HTTP/1.1\n:: value\nA: 1");
    expect(result.errors).toEqual([
      { line: 1, code: "no-separator" },
      { line: 2, code: "empty-key" },
    ]);
    expect(result.entries).toHaveLength(1);
  });

  it("skips comments, and reads them as disabled when asked", () => {
    expect(pairs("# note\nA: 1", parseHeaders)).toEqual([["A", "1"]]);
    expect(
      parseHeaders("# A: 1\n# see http://x", { disabledComments: true })
        .entries,
    ).toEqual([{ key: "A", value: "1", line: 1, enabled: false }]);
  });
});

describe("parseJson", () => {
  it("reads an object, and writes scalars as text", () => {
    expect(
      pairs('{"a":"x","n":1,"t":true,"z":null,"f":1.5}', parseJson),
    ).toEqual([
      ["a", "x"],
      ["n", "1"],
      ["t", "true"],
      ["z", ""],
      ["f", "1.5"],
    ]);
  });

  it("reads an array of pairs, in the Postman, AWS and name/value shapes", () => {
    const result = parseJson(
      '[{"key":"a","value":"1","enabled":false},{"Key":"b","Value":"2"},{"name":"c","value":"3","disabled":true}]',
    );
    expect(result.errors).toEqual([]);
    expect(result.entries).toEqual([
      { key: "a", value: "1", line: 1, enabled: false },
      { key: "b", value: "2", line: 2 },
      { key: "c", value: "3", line: 3, enabled: false },
    ]);
  });

  it("keeps __proto__ as data", () => {
    const result = parseJson('{"__proto__": "x", "a": "1"}');
    expect(result.entries.map((e) => e.key)).toEqual(["__proto__", "a"]);
  });

  it("reports nested values and bad items, and keeps the rest", () => {
    const result = parseJson('{"a":{"b":1},"c":[1],"d":"ok"}');
    expect(result.errors).toEqual([
      { line: 1, code: "nested-value" },
      { line: 2, code: "nested-value" },
    ]);
    expect(pairs('{"a":{"b":1},"d":"ok"}', parseJson)).toEqual([["d", "ok"]]);
    expect(parseJson('[1,{"key":"a","value":"x"}]').errors).toEqual([
      { line: 1, code: "not-an-object" },
    ]);
  });

  it.each([
    ["{", "invalid-json"],
    ["null", "not-an-object"],
    ['"text"', "not-an-object"],
    ["42", "not-an-object"],
  ])("rejects %s", (text, code) => {
    expect(parseJson(text).errors).toEqual([{ line: 0, code }]);
  });

  it("does not throw on deep nesting", () => {
    const text = `${"[".repeat(200_000)}${"]".repeat(200_000)}`;
    expect(() => parseJson(text, { maxLength: 500_000 })).not.toThrow();
  });
});

describe("detectSyntax and parseKeyValue", () => {
  it.each([
    ["KEY=value", "env"],
    ["export KEY=value", "env"],
    ["# header\nKEY=value", "env"],
    ["Content-Type: application/json", "headers"],
    ["Authorization: Bearer abc==", "headers"],
    ['{"a":"1"}', "json"],
    ['[{"key":"a","value":"1"}]', "json"],
    ["hello", undefined],
    ["DATABASE_URL", undefined],
    ["postgres://u:p@host/db?x=1", undefined],
    ["a sentence with = in it", undefined],
    ["{ not json", undefined],
    ["", undefined],
  ])("detects %j as %s", (text, expected) => {
    expect(detectSyntax(text)).toBe(expected);
  });

  it("gives nothing for text with no syntax", () => {
    expect(parseKeyValue("hello").entries).toEqual([]);
  });

  it("parses as the syntax it is told, not the one it sees", () => {
    expect(parseKeyValue("A: 1", "env").errors).toEqual([
      { line: 1, code: "no-separator" },
    ]);
  });
});

describe("serializers", () => {
  it("quotes a value only when it has to", () => {
    expect(
      serializeDotenv([
        { key: "PLAIN", value: "abc-1.2/x:y=z" },
        { key: "SPACE", value: "a b" },
        { key: "EMPTY", value: "" },
        { key: "HASH", value: "a#b" },
        { key: "LEAD", value: " x" },
        { key: "NL", value: "a\nb" },
      ]),
    ).toBe(
      [
        "PLAIN=abc-1.2/x:y=z",
        'SPACE="a b"',
        "EMPTY=",
        'HASH="a#b"',
        'LEAD=" x"',
        'NL="a\\nb"',
      ].join("\n"),
    );
  });

  it("never lets a value add a line", () => {
    const text = serializeDotenv([{ key: "A", value: "x\nEVIL=1\r\n# c" }]);
    expect(text.split("\n")).toHaveLength(1);
    expect(parseDotenv(text).entries).toHaveLength(1);
  });

  it("leaves out rows it cannot write", () => {
    expect(
      serializeDotenv([
        { key: "", value: "x" },
        { key: "A B", value: "x" },
        { key: "A=B", value: "x" },
        { key: "A#", value: "x" },
        { key: 'A"', value: "x" },
        { key: "S", value: "", stored: true },
        { key: "OFF", value: "1", enabled: false },
        { key: "OK", value: "1" },
      ]),
    ).toBe("OK=1");
  });

  it("writes disabled rows as comments when asked, and reads them back", () => {
    const rows = [
      { key: "A", value: "1" },
      { key: "B", value: "two words", enabled: false },
    ];
    const text = serializeDotenv(rows, { disabled: "comment" });
    expect(text).toBe('A=1\n# B="two words"');
    expect(parseDotenv(text, { disabledComments: true }).entries).toEqual([
      { key: "A", value: "1", line: 1 },
      { key: "B", value: "two words", line: 2, enabled: false },
    ]);
  });

  it("writes headers, with a line break in a value turned into a space", () => {
    expect(
      serializeHeaders([
        { key: "A", value: "1\r\nInjected: yes" },
        { key: "Bad Name", value: "x" },
        { key: "Bad:Name", value: "x" },
        { key: "Empty", value: "" },
      ]),
    ).toBe("A: 1 Injected: yes\nEmpty:");
  });

  it("writes JSON as an object, last duplicate winning, or as a list", () => {
    const rows = [
      { key: "a", value: "1" },
      { key: "a", value: "2" },
      { key: "__proto__", value: "x" },
      { key: "off", value: "1", enabled: false },
    ];
    expect(JSON.parse(serializeJson(rows)).a).toBe("2");
    expect(Object.keys(JSON.parse(serializeJson(rows)))).toEqual([
      "a",
      "__proto__",
    ]);
    expect(JSON.parse(serializeJson(rows, { array: true }))).toEqual([
      { key: "a", value: "1" },
      { key: "a", value: "2" },
      { key: "__proto__", value: "x" },
    ]);
  });

  it("dispatches by syntax", () => {
    const rows = [{ key: "A", value: "1" }];
    expect(serializeKeyValue(rows, "env")).toBe("A=1");
    expect(serializeKeyValue(rows, "headers")).toBe("A: 1");
    expect(JSON.parse(serializeKeyValue(rows, "json"))).toEqual({ A: "1" });
  });
});

describe("round trip", () => {
  // A small seeded generator, so a failure repeats.
  function random(seed: number) {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }
  const alphabet = [..."abcXYZ019 _-./:=#'\"`\\$\n\r\t", "é", "💥", " ", "\0"];

  it("reads back what dotenv wrote, for 2000 random values", () => {
    const next = random(7);
    for (let i = 0; i < 2000; i++) {
      const length = Math.floor(next() * 12);
      let value = "";
      for (let j = 0; j < length; j++) {
        value += alphabet[Math.floor(next() * alphabet.length)];
      }
      const text = serializeDotenv([{ key: "K", value }]);
      const entries = parseDotenv(text).entries;
      // Lone CR is a line break on the way in, so the writer escapes it; every
      // other value must come back exactly.
      expect(entries, JSON.stringify(value)).toEqual([
        { key: "K", value, line: 1 },
      ]);
    }
  });

  it("reads back what the other writers wrote", () => {
    const rows = [
      { key: "Accept", value: "text/html, */*;q=0.8" },
      { key: "X-Empty", value: "" },
    ];
    expect(
      parseHeaders(serializeHeaders(rows)).entries.map((e) => e.value),
    ).toEqual(["text/html, */*;q=0.8", ""]);
    expect(
      parseJson(serializeJson(rows, { array: true })).entries,
    ).toHaveLength(2);
  });
});
