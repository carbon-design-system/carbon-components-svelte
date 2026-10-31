// @vitest-environment node
import {
  ensureContrast,
  hasAnsi,
  parseAnsi,
  stripAnsi,
} from "../../src/utils/ansi.js";
import {
  contrastRatio,
  relativeLuminance,
} from "../../src/utils/color-contrast.js";

const ESC = "\u001b";

describe("parseAnsi", () => {
  it("returns plain text as one unstyled run", () => {
    expect(parseAnsi("hello")).toEqual([{ text: "hello", style: null }]);
    expect(parseAnsi("")).toEqual([]);
  });

  it("styles text between a color and its reset", () => {
    expect(parseAnsi(`a${ESC}[31mb${ESC}[0mc`)).toEqual([
      { text: "a", style: null },
      { text: "b", style: { fg: 1 } },
      { text: "c", style: null },
    ]);
  });

  it("reads bright and background colors from the 16-color palette", () => {
    expect(parseAnsi(`${ESC}[92;44mx`)).toEqual([
      { text: "x", style: { fg: 10, bg: 4 } },
    ]);
    expect(parseAnsi(`${ESC}[101mx`)).toEqual([
      { text: "x", style: { bg: 9 } },
    ]);
  });

  it("keeps the 256-color indexes below 16 in the palette and maps the rest to hex", () => {
    const [low, cube, gray] = parseAnsi(
      `${ESC}[38;5;9ma${ESC}[38;5;196mb${ESC}[38;5;244mc`,
    );
    expect(low.style).toEqual({ fg: 9 });
    expect(cube.style).toEqual({ fg: "#ff0000" });
    expect(gray.style).toEqual({ fg: "#808080" });
  });

  it("reads truecolor in the semicolon and the colon forms", () => {
    expect(parseAnsi(`${ESC}[38;2;18;52;86mx`)[0].style).toEqual({
      fg: "#123456",
    });
    expect(parseAnsi(`${ESC}[48:2::255:128:0mx`)[0].style).toEqual({
      bg: "#ff8000",
    });
    expect(parseAnsi(`${ESC}[1;38;2;1;2;3;4mx`)[0].style).toEqual({
      bold: true,
      fg: "#010203",
      underline: true,
    });
  });

  it("clamps channels and ignores a truncated extended color", () => {
    expect(parseAnsi(`${ESC}[38;2;999;0;0mx`)[0].style).toEqual({
      fg: "#ff0000",
    });
    expect(parseAnsi(`${ESC}[31;38;2;1mx`)[0].style).toEqual({ fg: 1 });
  });

  it("applies and clears attributes", () => {
    expect(parseAnsi(`${ESC}[1;3;4;9mx${ESC}[22;23;24;29my`)).toEqual([
      {
        text: "x",
        style: { bold: true, italic: true, underline: true, strike: true },
      },
      { text: "y", style: null },
    ]);
  });

  it("treats an empty parameter list as a reset", () => {
    expect(parseAnsi(`${ESC}[31ma${ESC}[mb`)).toEqual([
      { text: "a", style: { fg: 1 } },
      { text: "b", style: null },
    ]);
  });

  it("swaps the colors of reverse video, using the page's own for a color never set", () => {
    expect(parseAnsi(`${ESC}[7mx`)[0].style).toEqual({
      fg: "background",
      bg: "text",
    });
    expect(parseAnsi(`${ESC}[31;7mx`)[0].style).toEqual({
      fg: "background",
      bg: 1,
    });
  });

  it("drops escapes that are not styles", () => {
    const text = `a${ESC}[2Kb${ESC}[1;1Hc${ESC}]8;;https://x.test${ESC}\\d${ESC}]0;title\u0007e${ESC}(Bf`;
    expect(parseAnsi(text).map((run) => run.text)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ]);
  });

  it("starts each line from the default style", () => {
    parseAnsi(`${ESC}[31mred`);
    expect(parseAnsi("next")).toEqual([{ text: "next", style: null }]);
  });
});

describe("stripAnsi", () => {
  it("removes every escape and leaves the text", () => {
    expect(stripAnsi(`${ESC}[1;31merror${ESC}[0m: ${ESC}[2Kdone`)).toBe(
      "error: done",
    );
    expect(stripAnsi("plain")).toBe("plain");
  });

  it("agrees with the runs of parseAnsi", () => {
    const text = `x${ESC}[32my${ESC}[39m${ESC}]0;t\u0007z`;
    expect(
      parseAnsi(text)
        .map((run) => run.text)
        .join(""),
    ).toBe(stripAnsi(text));
  });
});

describe("hasAnsi", () => {
  it("detects an escape character", () => {
    expect(hasAnsi(`a${ESC}[0m`)).toBe(true);
    expect(hasAnsi("a")).toBe(false);
  });
});

describe("ensureContrast", () => {
  const white = relativeLuminance([1, 1, 1]);
  const dark = relativeLuminance([22 / 255, 22 / 255, 22 / 255]);

  it("keeps a color that already reads", () => {
    expect(ensureContrast("#0e6027", white)).toBe("#0e6027");
    expect(ensureContrast("#a7f0ba", dark)).toBe("#a7f0ba");
  });

  it("darkens a pale color on a light background until it reads", () => {
    const adjusted = ensureContrast("#ffff00", white);
    expect(adjusted).not.toBe("#ffff00");
    expect(contrastRatio(adjusted, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("lightens a deep color on a dark background until it reads", () => {
    const adjusted = ensureContrast("#000080", dark);
    expect(contrastRatio(adjusted, "#161616")).toBeGreaterThanOrEqual(4.5);
  });

  it("stops at the nearest shade that reads", () => {
    const adjusted = ensureContrast("#808080", white);
    expect(contrastRatio(adjusted, "#ffffff")).toBeLessThan(5);
  });

  it("returns a value that is not #rrggbb unchanged", () => {
    expect(ensureContrast("red", white)).toBe("red");
  });
});
