// @vitest-environment node
import source from "../../src/utils/terminal-text.js?raw";
import { createTerminalBuffer } from "../../src/utils/terminal-text.js";

const CONTROL = {
  test(text: string) {
    return [...text].some((char) => {
      const code = char.charCodeAt(0);
      return (
        code < 0x20 ||
        (code >= 0x7f && code <= 0x9f) ||
        code === 0x61c ||
        (code >= 0x202a && code <= 0x202e) ||
        (code >= 0x2066 && code <= 0x2069)
      );
    });
  },
};

/** A small seeded generator, so a failure repeats. */
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const RLO = String.fromCharCode(0x202e);

const PIECES = [
  "\x1b",
  "\x1b[",
  "\x1b]",
  "\x1b]8;;",
  "\x1b\\",
  "\x07",
  "\x1bP",
  "\x1b_",
  "[",
  "]",
  ";",
  ":",
  "?",
  "0",
  "1",
  "2",
  "5",
  "38",
  "48",
  "255",
  "m",
  "K",
  "H",
  "J",
  "A",
  "\r",
  "\n",
  "\r\n",
  "\b",
  "\t",
  "\x00",
  "\x9b",
  RLO,
  "text",
  " ",
  "😀",
  "\ud83d",
  "\ude00",
  "é",
];

function soup(next: () => number, length: number) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PIECES[Math.floor(next() * PIECES.length)];
  }
  return out;
}

function chunked(text: string, next: () => number) {
  const chunks: string[] = [];
  for (let i = 0; i < text.length;) {
    const size = 1 + Math.floor(next() * 9);
    chunks.push(text.slice(i, i + size));
    i += size;
  }
  return chunks;
}

function readAll(chunks: string[], options = {}) {
  const buffer = createTerminalBuffer(options);
  for (const chunk of chunks) buffer.write(chunk);
  return buffer.view();
}

describe("terminal text: fuzz", () => {
  it("never throws and never lets a control character through", () => {
    const next = random(1);
    for (let n = 0; n < 4000; n++) {
      const text = soup(next, 1 + Math.floor(next() * 60));
      const rows = readAll([text], { maxLineLength: 40 });
      for (const row of rows) {
        expect(CONTROL.test(row.text)).toBe(false);
        expect([...row.text].length).toBeLessThanOrEqual(41);
        if (row.runs) {
          expect(row.runs.map((run) => run.text).join("")).toBe(row.text);
        }
      }
    }
  });

  it("reads the same text however the stream is split", () => {
    const next = random(2);
    for (let n = 0; n < 1500; n++) {
      const text = soup(next, 1 + Math.floor(next() * 50));
      const whole = readAll([text]);
      const split = readAll(chunked(text, next));
      expect(split).toEqual(whole);
    }
  });

  it("reads every prefix and suffix of a real stream", () => {
    const sample =
      "\x1b[1;32m✔\x1b[0m build \x1b]8;;https://x.test\x07ok\x1b]8;;\x07\r" +
      "progress 50%\r\x1b[2Kdone\n\x1b[38;2;255;0;0mred\x1b[0m\n";
    for (let i = 0; i <= sample.length; i++) {
      for (const part of [sample.slice(0, i), sample.slice(i)]) {
        for (const row of readAll([part])) {
          expect(CONTROL.test(row.text)).toBe(false);
        }
      }
    }
  });

  describe("adversarial streams", () => {
    const ESC = "\x1b";
    const cases: Array<[string, () => string]> = [
      ["500,000 characters of one letter", () => "a".repeat(500_000)],
      ["500,000 newlines", () => "\n".repeat(500_000)],
      ["250,000 carriage returns and letters", () => "\rx".repeat(250_000)],
      [
        "a long row, then 100,000 erases to the start",
        () => {
          return `${"y".repeat(20_000)}${`${ESC}[1K`.repeat(100_000)}`;
        },
      ],
      [
        "100,000 erases to the end after a long row",
        () => {
          return `${"y".repeat(20_000)}\r${`${ESC}[K`.repeat(100_000)}`;
        },
      ],
      ["100,000 empty CSI openers", () => `${ESC}[`.repeat(100_000)],
      ["100,000 OSC openers", () => `${ESC}]`.repeat(100_000)],
      [
        "an OSC string of 500,000 characters",
        () => `${ESC}]0;${"t".repeat(500_000)}`,
      ],
      [
        "10,000 nested openers",
        () => `${"[".repeat(10_000)}${ESC}[`.repeat(10),
      ],
      [
        "100,000 distinct truecolors",
        () => {
          let out = "";
          for (let i = 0; i < 100_000; i++) {
            out += `${ESC}[38;2;${i % 256};${(i >> 8) % 256};${i % 7}mx`;
          }
          return out;
        },
      ],
      ["100,000 resets", () => `${ESC}[0m`.repeat(100_000)],
      [
        "a row of 16,000 styles, then 100,000 overwrites",
        () => {
          let out = "";
          for (let i = 0; i < 8000; i++) out += `${ESC}[3${i % 8}ma${ESC}[0mb`;
          return `${out}${"\rz".repeat(100_000)}`;
        },
      ],
      ["100,000 backspaces and tabs", () => "\b\t".repeat(100_000)],
      [
        "100,000 parameters in one sequence",
        () => `${ESC}[${"9;".repeat(100_000)}m`,
      ],
      [
        "bidi and control characters",
        () => `${RLO}\x00\x9b\x07`.repeat(200_000),
      ],
    ];

    it.each(cases)(
      "%s finishes quickly",
      (_name, build) => {
        const text = build();
        const started = performance.now();
        const rows = readAll([text]);
        const elapsed = performance.now() - started;
        expect(elapsed).toBeLessThan(2000);
        for (const row of rows.slice(0, 50)) {
          expect(CONTROL.test(row.text)).toBe(false);
        }
      },
      10_000,
    );

    it("keeps memory bounded: rows past maxLines are dropped as they arrive", () => {
      const buffer = createTerminalBuffer({ maxLines: 100 });
      for (let i = 0; i < 200_000; i++) buffer.write(`line ${i}\n`);
      expect(buffer.size()).toBeLessThan(100 * 1.25 + 1001);
      buffer.trim();
      expect(buffer.size()).toBe(100);
    });
  });

  it("does not evaluate anything", () => {
    expect(source).not.toMatch(/\beval\s*\(|new Function|import\(|setTimeout/);
    expect(source).not.toMatch(/new RegExp|innerHTML|insertAdjacentHTML/);
  });
});
