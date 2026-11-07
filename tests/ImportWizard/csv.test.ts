// @vitest-environment node
import { csvCore } from "../../src/ImportWizard/csv-core.js";
import { parseFile } from "../../src/ImportWizard/parse-file.js";

const core = csvCore();

function parse(text: string, delimiter = ",", chunk = 0) {
  const parser = core.createParser(delimiter);
  const rows: string[][] = [];
  if (chunk) {
    for (let i = 0; i < text.length; i += chunk) {
      rows.push(...parser.write(text.slice(i, i + chunk)));
    }
  } else {
    rows.push(...parser.write(text));
  }
  rows.push(...parser.end());
  return { rows, issues: parser.issues() };
}

describe("csv parser", () => {
  it.each([
    [
      "simple",
      "a,b\n1,2",
      [
        ["a", "b"],
        ["1", "2"],
      ],
    ],
    [
      "CRLF",
      "a,b\r\n1,2\r\n",
      [
        ["a", "b"],
        ["1", "2"],
      ],
    ],
    [
      "lone CR",
      "a,b\r1,2\r",
      [
        ["a", "b"],
        ["1", "2"],
      ],
    ],
    ["trailing newline adds no row", "a\n", [["a"]]],
    [
      "empty fields",
      "a,,c\n,,\n",
      [
        ["a", "", "c"],
        ["", "", ""],
      ],
    ],
    ["trailing delimiter", "a,b,\n", [["a", "b", ""]]],
    ["quoted delimiter", 'a,"b,c",d', [["a", "b,c", "d"]]],
    ["quoted newline", 'a,"b\nc",d', [["a", "b\nc", "d"]]],
    ["quoted CRLF kept", 'a,"b\r\nc"', [["a", "b\r\nc"]]],
    ["escaped quote", 'a,"say ""hi""",c', [["a", 'say "hi"', "c"]]],
    ["empty quoted field", 'a,"",c', [["a", "", "c"]]],
    ["a quoted empty line is a row", '""\na', [[""], ["a"]]],
    ["blank lines are skipped", "a\n\n\nb\n", [["a"], ["b"]]],
    ["spaces are kept", " a , b ", [[" a ", " b "]]],
    ["quote inside an unquoted field is literal", 'ab"c,d', [['ab"c', "d"]]],
    [
      "no final newline",
      "a,b\n1,2",
      [
        ["a", "b"],
        ["1", "2"],
      ],
    ],
    ["a single field", "x", [["x"]]],
    ["empty input", "", []],
    ["unicode", "é,日本,😀\n", [["é", "日本", "😀"]]],
  ])("%s", (_, text, expected) => {
    expect(parse(text).rows).toEqual(expected);
  });

  it("gives the same rows whatever the chunk size", () => {
    const lines = Array.from(
      { length: 40 },
      (_, i) => `${i},"a ""q"" ${i}\r\nline",x${i}`,
    );
    const text = `${lines.join("\r\n")}\r\n`;
    const whole = parse(text).rows;
    expect(whole).toHaveLength(40);
    for (const size of [1, 2, 3, 5, 7, 64]) {
      expect(parse(text, ",", size).rows).toEqual(whole);
    }
  });

  it("keeps a CRLF split across two chunks as one break", () => {
    expect(parse("a\r\nb", ",", 2).rows).toEqual([["a"], ["b"]]);
    expect(parse('"a"\r\nb', ",", 4).rows).toEqual([["a"], ["b"]]);
  });

  it("parses the other delimiters", () => {
    expect(parse("a;b\n1;2", ";").rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(parse("a\tb\n1\t2", "\t").rows[1]).toEqual(["1", "2"]);
    expect(parse("a|b\n1|2", "|").rows[1]).toEqual(["1", "2"]);
  });

  describe("malformed input", () => {
    it("reports an unclosed quote and keeps the rest as that field", () => {
      const { rows, issues } = parse('a,b\n1,"never closed\n2,3');
      expect(rows).toEqual([
        ["a", "b"],
        ["1", "never closed\n2,3"],
      ]);
      expect(issues).toEqual([{ type: "unclosed-quote", row: 1 }]);
    });

    it("reports text after a closing quote and keeps it", () => {
      const { rows, issues } = parse('"ab"c,d\n');
      expect(rows).toEqual([["abc", "d"]]);
      expect(issues).toEqual([{ type: "stray-quote", row: 0 }]);
    });

    it("returns ragged rows as they are", () => {
      expect(parse("a,b,c\n1,2\n1,2,3,4\n").rows).toEqual([
        ["a", "b", "c"],
        ["1", "2"],
        ["1", "2", "3", "4"],
      ]);
    });

    it("does not throw on a lone quote", () => {
      expect(parse('"').rows).toEqual([[""]]);
      expect(parse('"').issues).toEqual([{ type: "unclosed-quote", row: 0 }]);
    });
  });
});

describe("sniffDelimiter", () => {
  it.each([
    [",", "a,b,c\n1,2,3\n4,5,6\n"],
    [";", "a;b;c\n1;2,5;3\n4;5;6\n"],
    ["\t", "a\tb\tc\n1\t2\t3\n"],
    ["|", "a|b|c\n1|2|3\n"],
  ])("finds %j", (expected, text) => {
    expect(core.sniffDelimiter(text)).toBe(expected);
  });

  it("ignores delimiters inside quotes", () => {
    expect(core.sniffDelimiter('a;b\n"x,y,z,w";2\n"1,2,3,4";5\n')).toBe(";");
  });

  it("falls back to a comma for a single column", () => {
    expect(core.sniffDelimiter("name\nAda\nGrace\n")).toBe(",");
  });

  it("tolerates a cut-off last record", () => {
    expect(core.sniffDelimiter("a;b;c\n1;2;3\n4;5;6\n7;8")).toBe(";");
  });
});

describe("detectEncoding", () => {
  it("reads byte order marks", () => {
    expect(
      core.detectEncoding(new Uint8Array([0xef, 0xbb, 0xbf, 0x61])),
    ).toEqual({
      encoding: "utf-8",
      bom: 3,
    });
    expect(
      core.detectEncoding(new Uint8Array([0xff, 0xfe, 0x61, 0])).encoding,
    ).toBe("utf-16le");
  });

  it("falls back to Windows-1252 for bytes that aren't UTF-8", () => {
    expect(
      core.detectEncoding(new Uint8Array([0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72])),
    ).toEqual({ encoding: "windows-1252", bom: 0 });
  });

  it("does not mistake a multibyte character cut by the sample for a failure", () => {
    const bytes = new TextEncoder().encode("日本");
    expect(core.detectEncoding(bytes.subarray(0, 4)).encoding).toBe("utf-8");
  });
});

function fileOf(bytes: Uint8Array | string, name = "x.csv") {
  return new File([bytes as BlobPart], name);
}

describe("parseFile (csv, main thread)", () => {
  const options = { worker: false } as const;

  it("strips a BOM and sniffs the delimiter", async () => {
    const text = "﻿name;city\nAda;London\n";
    const result = await parseFile(fileOf(text), options);
    expect(result.rows).toEqual([
      ["name", "city"],
      ["Ada", "London"],
    ]);
    expect(result).toMatchObject({
      delimiter: ";",
      encoding: "utf-8",
      format: "csv",
    });
  });

  it("decodes a Windows-1252 file", async () => {
    // "Müller;Zoë;€5" in Windows-1252
    const bytes = new Uint8Array([
      0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72, 0x3b, 0x5a, 0x6f, 0xeb, 0x3b, 0x80,
      0x35, 0x0d, 0x0a, 0x61, 0x3b, 0x62, 0x3b, 0x63,
    ]);
    const result = await parseFile(fileOf(bytes), options);
    expect(result.encoding).toBe("windows-1252");
    expect(result.rows[0]).toEqual(["Müller", "Zoë", "€5"]);
  });

  it("restarts as Windows-1252 when a late byte is not UTF-8", async () => {
    const head = "a,b\n".repeat(40000);
    const bytes = new Uint8Array([
      ...new TextEncoder().encode(head),
      ...new TextEncoder().encode("caf"),
      0xe9,
      ...new TextEncoder().encode(",x\n"),
    ]);
    const result = await parseFile(fileOf(bytes), options);
    expect(result.encoding).toBe("windows-1252");
    expect(result.rows).toHaveLength(40001);
    expect(result.rows[40000][0]).toBe("café");
  });

  it("decodes UTF-16 from Excel's Unicode text export", async () => {
    const text = "﻿name\tcity\nAda\tLondon\n";
    const bytes = new Uint8Array(text.length * 2);
    for (let i = 0; i < text.length; i++) {
      bytes[i * 2] = text.charCodeAt(i) & 255;
      bytes[i * 2 + 1] = text.charCodeAt(i) >> 8;
    }
    const result = await parseFile(fileOf(bytes), options);
    expect(result.encoding).toBe("utf-16le");
    expect(result.rows).toEqual([
      ["name", "city"],
      ["Ada", "London"],
    ]);
  });

  it("honors Excel's sep= line", async () => {
    const result = await parseFile(fileOf("sep=;\na;b\n1;2\n"), options);
    expect(result.rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(result.delimiter).toBe(";");
  });

  it("takes an explicit delimiter and encoding", async () => {
    const result = await parseFile(fileOf("a;b,c\n1;2,3"), {
      ...options,
      delimiter: ",",
    });
    expect(result.rows[0]).toEqual(["a;b", "c"]);
  });

  it("stops at maxRows", async () => {
    const result = await parseFile(fileOf("a\n1\n2\n3\n"), {
      ...options,
      maxRows: 2,
    });
    expect(result.rows).toEqual([["a"], ["1"]]);
    expect(result.truncated).toBe(true);
  });

  it("reports progress up to the full size", async () => {
    const progress: number[] = [];
    const file = fileOf("a,b\n".repeat(1000));
    await parseFile(file, {
      ...options,
      onProgress: ({ loaded }) => progress.push(loaded),
    });
    expect(progress.at(-1)).toBe(file.size);
  });

  it("rejects with an AbortError when aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      parseFile(fileOf("a\n1"), { ...options, signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("aborts between chunks of a large file", async () => {
    const controller = new AbortController();
    const file = fileOf("abcdefgh,ijklmnop\n".repeat(400000));
    const parsing = parseFile(file, {
      ...options,
      signal: controller.signal,
      onProgress: () => controller.abort(),
    });
    await expect(parsing).rejects.toMatchObject({ name: "AbortError" });
  });

  it("parses 100,000 rows by 20 columns", async () => {
    const header = Array.from({ length: 20 }, (_, i) => `col${i}`).join(",");
    const lines = [header];
    for (let r = 0; r < 100_000; r++) {
      const cells = [];
      for (let c = 0; c < 20; c++) {
        cells.push(c % 5 === 4 ? `"Smith, ${r} ""x"""` : `v${r}-${c}`);
      }
      lines.push(cells.join(","));
    }
    const file = fileOf(lines.join("\r\n"));
    const started = performance.now();
    const result = await parseFile(file, options);
    const elapsed = performance.now() - started;
    expect(result.rows).toHaveLength(100_001);
    expect(result.rows[99_999][4]).toBe('Smith, 99998 "x"');
    // The target is 2 s in a worker; a loaded CI box gets generous slack.
    expect(elapsed).toBeLessThan(5000);
  }, 30_000);
});
