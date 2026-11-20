// @vitest-environment node
import {
  contrastRatio,
  ensureContrast,
} from "../../src/utils/color-contrast.js";
import {
  createTerminalBuffer,
  stripControls,
} from "../../src/utils/terminal-text.js";

// Bidi controls are named here, so no invisible character sits in the source.
const RLO = String.fromCharCode(0x202e);
const LRI = String.fromCharCode(0x2066);
const ALM = String.fromCharCode(0x061c);

function read(...chunks: string[]) {
  const buffer = createTerminalBuffer();
  for (const chunk of chunks) buffer.write(chunk);
  return buffer.view();
}

function texts(...chunks: string[]) {
  return read(...chunks).map((row) => row.text);
}

describe("createTerminalBuffer", () => {
  it("splits rows on newlines and keeps the open row", () => {
    expect(texts("one\ntwo\nthr", "ee")).toEqual(["one", "two", "three"]);
    expect(texts("one\n")).toEqual(["one"]);
    expect(texts("a\n\nb")).toEqual(["a", "", "b"]);
  });

  it("gives rows ids that count up and survive a trim", () => {
    const buffer = createTerminalBuffer({ maxLines: 2 });
    buffer.write("a\nb\nc\nd\n");
    expect(buffer.trim()).toBe(2);
    expect(buffer.view().map((row) => [row.id, row.text])).toEqual([
      [2, "c"],
      [3, "d"],
    ]);
  });

  it("styles runs with SGR and carries the style across rows", () => {
    const rows = read("\x1b[1;31mred\x1b[0m plain\n");
    expect(rows).toHaveLength(1);
    expect(rows[0].text).toBe("red plain");
    expect(rows[0].runs).toEqual([
      { text: "red", style: { fg: 1, bold: true } },
      { text: " plain", style: {} },
    ]);

    const carried = read("\x1b[32mgreen\nstill green\x1b[39m\nplain");
    expect(carried[0].runs).toEqual([{ text: "green", style: { fg: 2 } }]);
    expect(carried[1].runs).toEqual([
      { text: "still green", style: { fg: 2 } },
    ]);
    expect(carried[2].runs).toBeNull();
  });

  it("maps 256-color, truecolor and bright colors", () => {
    const [row] = read(
      "\x1b[38;5;196ma\x1b[38;5;3mb\x1b[38;2;1;2;3mc\x1b[38:2::4:5:6md\x1b[91me\x1b[48;5;232mf",
    );
    expect(row.runs?.map((run) => run.style)).toEqual([
      { fg: "#ff0000" },
      { fg: 3 },
      { fg: "#010203" },
      { fg: "#040506" },
      { fg: 9 },
      { fg: 9, bg: "#080808" },
    ]);
  });

  it("swaps colors for reverse video", () => {
    const [row] = read("\x1b[7mx\x1b[31my\x1b[27mz");
    expect(row.runs?.map((run) => run.style)).toEqual([
      { fg: "background", bg: "text" },
      { fg: "background", bg: 1 },
      { fg: 1 },
    ]);
  });

  it("joins a sequence split across chunks", () => {
    const [row] = read("a\x1b", "[3", "1;", "1mb\x1b[0", "mc");
    expect(row.text).toBe("abc");
    expect(row.runs?.[1]).toEqual({ text: "b", style: { fg: 1, bold: true } });
  });

  describe("carriage return", () => {
    it("overwrites from the start of the row", () => {
      expect(texts("loading 10%\rloading 55%\rdone       ")).toEqual([
        "done       ",
      ]);
      expect(texts("abcdef\rxy")).toEqual(["xycdef"]);
      expect(texts("abc\r\ndef")).toEqual(["abc", "def"]);
    });

    it("keeps the style of each cell it does not overwrite", () => {
      const [row] = read("\x1b[31mabcd\x1b[0m\rXY");
      expect(row.text).toBe("XYcd");
      expect(row.runs).toEqual([
        { text: "XY", style: {} },
        { text: "cd", style: { fg: 1 } },
      ]);
    });

    it("steps back with backspace and pads tabs", () => {
      expect(texts("abc\b\bX")).toEqual(["aXc"]);
      expect(texts("a\tb")).toEqual(["a       b"]);
    });
  });

  describe("erase in line", () => {
    it("erases to the end, to the start and the whole row", () => {
      expect(texts("hello world\r\x1b[K")).toEqual([]);
      expect(texts("hello world\rab\x1b[K")).toEqual(["ab"]);
      expect(texts("hello world\x1b[2K")).toEqual([]);
      expect(texts("hello\x1b[1Kx")).toEqual(["     x"]);
      expect(texts("old text\r\x1b[2Knew")).toEqual(["new"]);
      expect(texts("abcdef\r\x1b[0Kxy")).toEqual(["xy"]);
    });

    it("ignores an erase it does not know", () => {
      expect(texts("abc\x1b[3Kdef")).toEqual(["abcdef"]);
    });
  });

  describe("unsupported sequences", () => {
    it("drops cursor movement and screen control", () => {
      expect(
        texts("a\x1b[2J\x1b[H\x1b[10;20Hb\x1b[?1049hc\x1b[?25ld\x1b[3A\x1b[Ge"),
      ).toEqual(["abcde"]);
      expect(texts("a\x1bcb\x1b7c\x1b(Bd\x1b=e")).toEqual(["abcde"]);
    });

    it("drops OSC strings, including OSC 8 links, and keeps the text", () => {
      expect(
        texts("see \x1b]8;;https://evil.test\x07link\x1b]8;;\x07 now"),
      ).toEqual(["see link now"]);
      expect(texts("\x1b]0;title\x1b\\text")).toEqual(["text"]);
      expect(texts("\x1bPdevice\x1b\\x\x1b_app\x07y\x1b^z\x1b\\")).toEqual([
        "xy",
      ]);
    });

    it("ends an unfinished string at a newline", () => {
      expect(texts("a\x1b]0;no end\nvisible")).toEqual(["a", "visible"]);
    });

    it("gives up on a string that never ends", () => {
      const rows = texts(`\x1b]0;${"x".repeat(10000)}tail`);
      expect(rows[0].length).toBeGreaterThan(5000);
      expect(rows[0].endsWith("tail")).toBe(true);
    });

    it("gives up on a CSI sequence with too many parameters", () => {
      const [row] = texts(`\x1b[${"1;".repeat(100)}mtext`);
      expect(row).toContain("text");
    });

    it("reads a character after an unfinished escape as text", () => {
      expect(texts("a\x1b\nb")).toEqual(["a", "b"]);
      expect(texts("a\x1b[1\nb")).toEqual(["a", "b"]);
      expect(texts("a\x1bébc")).toEqual(["aébc"]);
      expect(texts("a\x1b\x1b[31mb")[0]).toBe("ab");
    });
  });

  describe("text only", () => {
    it("removes control characters and bidi overrides", () => {
      expect(texts(`a\x00b\x07c\x7fd\u0085e${RLO}f${LRI}g${ALM}h`)).toEqual([
        "abcdefgh",
      ]);
      expect(stripControls(`x\x1b[31my${RLO}`)).toBe("x[31my");
    });

    it("keeps surrogate pairs whole", () => {
      const [row] = read("a😀b\rX");
      expect(row.text).toBe("X😀b");
    });

    it("never produces markup: the text is what was written", () => {
      expect(texts("<img src=x onerror=alert(1)>")).toEqual([
        "<img src=x onerror=alert(1)>",
      ]);
    });
  });

  it("cuts a long row and marks it", () => {
    const buffer = createTerminalBuffer({ maxLineLength: 10 });
    buffer.write(`${"x".repeat(25)}\nshort\n`);
    const [long, short] = buffer.view();
    expect(long.text).toBe(`${"x".repeat(9)}…`);
    expect(long.truncated).toBe(true);
    expect(short.truncated).toBeUndefined();
  });

  it("echoes a command on a row of its own", () => {
    const buffer = createTerminalBuffer();
    buffer.write("partial");
    buffer.echo("$ ", "ls \x1b[31m-la");
    const [open, command] = buffer.view();
    expect(open.text).toBe("partial");
    expect(command).toMatchObject({
      kind: "command",
      prompt: "$ ",
      command: "ls [31m-la",
      text: "$ ls [31m-la",
    });
  });

  it("clears and reads the scrollback as text", () => {
    const buffer = createTerminalBuffer();
    buffer.write("a\n\x1b[1mb\x1b[0m\nc");
    expect(buffer.getText()).toBe("a\nb\nc");
    expect(buffer.size()).toBe(3);
    buffer.clear();
    expect(buffer.view()).toEqual([]);
    expect(buffer.getText()).toBe("");
  });
});

describe("ensureContrast", () => {
  it("leaves a readable color and lightens one that is not", () => {
    expect(ensureContrast("#ffffff", 0.01)).toBe("#ffffff");
    const fixed = ensureContrast("#000080", 0.01);
    expect(fixed).not.toBe("#000080");
    expect(contrastRatio(fixed, "#161616") ?? 0).toBeGreaterThanOrEqual(4.5);
  });
});
