import { ReadableStream } from "node:stream/web";
import {
  chunkEnd,
  decodeText,
  defaultRenderers,
  fileKind,
  languageOf,
  looksBinary,
  mergeRenderers,
  nameFromUrl,
  parseCsv,
  pickRenderer,
  prettyJson,
  readCapped,
  revealBidi,
  safeBlobType,
  safeLink,
  safeSource,
} from "../../src/FilePreview/file-preview.js";

const bytes = (text: string) => new TextEncoder().encode(text);

describe("fileKind", () => {
  it.each([
    ["image/png", "a", "image"],
    ["", "photo.JPG", "image"],
    ["application/octet-stream", "clip.mp4", "video"],
    ["application/pdf", "x", "pdf"],
    ["text/markdown", "x", "markdown"],
    ["text/plain", "README.md", "markdown"],
    ["application/vnd.ms-excel", "tickets.csv", "csv"],
    ["application/vnd.api+json", "x", "json"],
    ["video/mp2t", "deploys.ts", "text"],
    ["text/html", "page.html", "text"],
    ["text/plain; charset=utf-8", "notes", "text"],
    ["application/zip", "a.zip", undefined],
    ["", "mystery", undefined],
  ])("reads %j named %j as %s", (mime, name, kind) => {
    expect(fileKind(mime, name)).toBe(kind);
  });

  it("shows a file as its declared type, so a .png that says text/html is text", () => {
    expect(fileKind("text/html", "logo.png")).toBe("text");
  });

  it("finds a language from the extension, then the type", () => {
    expect(languageOf("video/mp2t", "a.ts")).toBe("ts");
    expect(languageOf("text/html", "x")).toBe("html");
    expect(languageOf("text/plain", "x.txt")).toBeUndefined();
  });
});

describe("renderer registry", () => {
  it("lets an app renderer win and replace a built-in by id", () => {
    const custom = { id: "csv", match: () => true, component: {} as never };
    const merged = mergeRenderers([custom]);

    expect(merged[0]).toBe(custom);
    expect(merged.filter((renderer) => renderer.id === "csv")).toEqual([
      custom,
    ]);
    expect(merged).toHaveLength(defaultRenderers.length);
  });

  it("falls through when a file is over a renderer's cap and it is not partial", () => {
    const json = pickRenderer(
      defaultRenderers,
      "application/json",
      "a.json",
      3 * 1024 * 1024,
    );

    // JSON caps at 2 MiB, so a 3 MiB file is source text, cut.
    expect(json.renderer?.id).toBe("text");
  });

  it("reports too-large when nothing takes the size, and unsupported when nothing matches", () => {
    expect(
      pickRenderer(defaultRenderers, "image/png", "a.png", 50 * 1024 * 1024),
    ).toEqual({
      reason: "too-large",
    });
    expect(
      pickRenderer(defaultRenderers, "application/zip", "a.zip", 10),
    ).toEqual({
      reason: "unsupported",
    });
  });

  it("does not cap a streamed renderer", () => {
    expect(
      pickRenderer(defaultRenderers, "video/mp4", "a.mp4", 5e9).renderer?.id,
    ).toBe("video");
  });

  it("treats a throwing match as no match", () => {
    const broken = {
      match: () => {
        throw new Error("no");
      },
    };

    expect(pickRenderer([broken], "text/plain", "a.txt", 1).reason).toBe(
      "unsupported",
    );
  });
});

describe("decodeText", () => {
  it("decodes UTF-8 and drops a BOM", () => {
    expect(
      decodeText(new Uint8Array([0xef, 0xbb, 0xbf, ...bytes("héllo")])),
    ).toMatchObject({
      text: "héllo",
      encoding: "utf-8",
    });
  });

  it("reads UTF-16LE from its BOM", () => {
    const body = new Uint8Array([0xff, 0xfe, 0x68, 0x00, 0x69, 0x00]);

    expect(decodeText(body)).toMatchObject({
      text: "hi",
      encoding: "utf-16le",
    });
  });

  it("falls back to Windows-1252 for bytes that are not UTF-8", () => {
    const latin1 = new Uint8Array([0x43, 0x61, 0x66, 0xe9]);

    expect(decodeText(latin1)).toMatchObject({
      text: "Café",
      encoding: "windows-1252",
    });
  });

  it("drops a multi-byte character cut at the end of a truncated read", () => {
    const cut = bytes("aé").subarray(0, 2);

    expect(decodeText(cut, true)).toMatchObject({
      text: "a",
      encoding: "utf-8",
    });
    expect(decodeText(cut, false).encoding).toBe("windows-1252");
  });

  it("flags binary: a NUL byte, a signature, or mostly control bytes", () => {
    expect(decodeText(new Uint8Array([0x61, 0, 0x62])).binary).toBe(true);
    expect(looksBinary(bytes("%PDF-1.7 not really"))).toBe(true);
    expect(looksBinary(new Uint8Array(100).fill(1))).toBe(true);
    expect(looksBinary(bytes("plain\ttext\r\nwith lines\n"))).toBe(false);
  });
});

describe("revealBidi", () => {
  it("shows bidirectional overrides instead of applying them", () => {
    expect(revealBidi("a‮b⁦c")).toBe("a<U+202E>b<U+2066>c");
    expect(revealBidi("clean")).toBe("clean");
  });
});

describe("chunkEnd", () => {
  it("stops at the line limit, at a line end", () => {
    const text = "a\nb\nc\nd\n";

    expect(chunkEnd(text, 0, 2)).toBe(4);
    expect(chunkEnd(text, 4, 2)).toBe(8);
  });

  it("cuts one very long line by characters, not past the text", () => {
    const line = "x".repeat(100_000);

    expect(chunkEnd(line, 0, 400, 1000)).toBe(1000);
    expect(chunkEnd("short", 0)).toBe(5);
  });

  it("does not split a surrogate pair", () => {
    const text = `${"x".repeat(9)}😀tail`;

    expect(chunkEnd(text, 0, 400, 10)).toBe(9);
  });
});

describe("prettyJson", () => {
  it("re-indents without losing digits a number cannot hold", () => {
    const out = prettyJson(
      '{"id":12345678901234567890,"a":[1,2],"e":{},"l":[]}',
    );

    expect(out).toBe(
      '{\n  "id": 12345678901234567890,\n  "a": [\n    1,\n    2\n  ],\n  "e": {},\n  "l": []\n}',
    );
  });

  it("keeps braces and escaped quotes inside strings", () => {
    const out = prettyJson('{"s":"a \\" , { ] b"}');

    expect(out).toBe('{\n  "s": "a \\" , { ] b"\n}');
  });

  it("returns null for invalid JSON", () => {
    expect(prettyJson("{nope")).toBeNull();
  });
});

describe("parseCsv", () => {
  it("handles quotes, doubled quotes, newlines in quotes and CRLF", () => {
    const { rows } = parseCsv('a,b\r\n"x, y","say ""hi"""\r\n"two\nlines",z');

    expect(rows).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"'],
      ["two\nlines", "z"],
    ]);
  });

  it("sniffs a tab or semicolon delimiter", () => {
    expect(parseCsv("a\tb\n1\t2").rows[1]).toEqual(["1", "2"]);
    expect(parseCsv("a;b;c\n1;2;3").delimiter).toBe(";");
  });

  it("stops at maxRows and caps columns and cell length", () => {
    const text = "a,b,c,d\n1,2,3,4\n5,6,7,8\n";
    const out = parseCsv(text, { maxRows: 2, maxColumns: 2, maxCell: 1 });

    expect(out.rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(out.more).toBe(true);
  });

  it("reads a large file in linear time", () => {
    const text = `${"a,b,c\n".repeat(200_000)}`;
    const start = performance.now();
    parseCsv(text, { maxRows: 1_000_000 });

    expect(performance.now() - start).toBeLessThan(1500);
  });
});

describe("links and urls", () => {
  it.each([
    ["https://example.com/a b".replace(" ", ""), "https://example.com/ab"],
    ["mailto:a@example.com", "mailto:a@example.com"],
    ["javascript:alert(1)", undefined],
    ["  javascript:alert(1)", undefined],
    ["java\tscript:alert(1)", undefined],
    ["data:text/html,<script>", undefined],
    ["https://user:pw@example.com/", undefined],
    ["//evil.example", undefined],
    ["/relative", undefined],
  ])("safeLink(%j)", (href, expected) => {
    expect(safeLink(href)).toBe(expected);
  });

  it("allows only fetchable schemes for a source", () => {
    expect(safeSource("javascript:alert(1)")).toBeUndefined();
    expect(safeSource("/a.png", "https://x.test/")).toBe(
      "https://x.test/a.png",
    );
    expect(safeSource("blob:https://x.test/1")).toBe("blob:https://x.test/1");
  });

  it("names a file from the last path segment", () => {
    expect(nameFromUrl("https://x.test/files/my%20report.pdf?sig=1")).toBe(
      "my report.pdf",
    );
    expect(nameFromUrl("data:text/plain,hi")).toBe("");
  });
});

describe("safeBlobType", () => {
  it("never gives a script-capable type to an object URL, except where it is inert", () => {
    expect(safeBlobType("text/html", "text")).toBe("application/octet-stream");
    expect(safeBlobType("image/svg+xml", "text")).toBe(
      "application/octet-stream",
    );
    expect(safeBlobType("image/svg+xml", "image")).toBe("image/svg+xml");
    expect(safeBlobType("application/pdf", "pdf")).toBe("application/pdf");
    expect(safeBlobType("application/pdf", "text")).toBe(
      "application/octet-stream",
    );
    expect(safeBlobType("audio/wav", "audio")).toBe("audio/wav");
  });
});

describe("readCapped", () => {
  it("stops reading at the cap and cancels the rest of the body", async () => {
    let pulled = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled++;
        controller.enqueue(new Uint8Array(1000));
      },
    });

    const { blob, truncated } = await readCapped(
      new Response(body as unknown as BodyInit),
      2500,
    );

    expect(truncated).toBe(true);
    expect(blob.size).toBe(2500);
    // A few chunks, not a download of the endless body.
    expect(pulled).toBeLessThan(10);
  });

  it("returns a short body whole", async () => {
    const { blob, truncated } = await readCapped(new Response("abc"), 100);

    expect(truncated).toBe(false);
    expect(blob.size).toBe(3);
  });
});
