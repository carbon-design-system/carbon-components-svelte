// @vitest-environment node
import {
  type DiffBlock,
  diffInline,
  diffSequence,
} from "../../src/utils/diff-lines.js";

function apply(a: string[], b: string[], blocks: DiffBlock[]) {
  const out: string[] = [];
  let i = 0;
  for (const block of blocks) {
    while (i < block.aStart) out.push(a[i++]);
    out.push(...b.slice(block.bStart, block.bEnd));
    i = block.aEnd;
  }
  while (i < a.length) out.push(a[i++]);
  return out;
}

function lcsLength(a: string[], b: string[]) {
  const rows = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      rows[i][j] =
        a[i] === b[j]
          ? rows[i + 1][j + 1] + 1
          : Math.max(rows[i + 1][j], rows[i][j + 1]);
    }
  }
  return rows[0][0];
}

function random(seed: number) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

describe("diffSequence", () => {
  it("returns no blocks for equal sequences", () => {
    expect(diffSequence(["a", "b"], ["a", "b"])).toEqual([]);
    expect(diffSequence([], [])).toEqual([]);
  });

  it("finds an insertion, a deletion and a replacement", () => {
    expect(diffSequence(["a", "c"], ["a", "b", "c"])).toEqual([
      { aStart: 1, aEnd: 1, bStart: 1, bEnd: 2 },
    ]);
    expect(diffSequence(["a", "b", "c"], ["a", "c"])).toEqual([
      { aStart: 1, aEnd: 2, bStart: 1, bEnd: 1 },
    ]);
    expect(diffSequence(["a", "b", "c"], ["a", "x", "c"])).toEqual([
      { aStart: 1, aEnd: 2, bStart: 1, bEnd: 2 },
    ]);
  });

  it("handles one side being empty", () => {
    expect(diffSequence([], ["a", "b"])).toEqual([
      { aStart: 0, aEnd: 0, bStart: 0, bEnd: 2 },
    ]);
    expect(diffSequence(["a", "b"], [])).toEqual([
      { aStart: 0, aEnd: 2, bStart: 0, bEnd: 0 },
    ]);
  });

  it("rebuilds the new sequence and keeps the shortest edit script", () => {
    const next = random(7);
    for (let round = 0; round < 400; round++) {
      const alphabet = 1 + Math.floor(next() * 6);
      const make = () =>
        Array.from(
          { length: Math.floor(next() * 22) },
          () => `l${Math.floor(next() * alphabet)}`,
        );
      const a = make();
      const b = make();
      const blocks = diffSequence(a, b);
      expect(apply(a, b, blocks)).toEqual(b);

      let removed = 0;
      let added = 0;
      for (const block of blocks) {
        removed += block.aEnd - block.aStart;
        added += block.bEnd - block.bStart;
      }
      const kept = lcsLength(a, b);
      expect(removed).toBe(a.length - kept);
      expect(added).toBe(b.length - kept);
    }
  });

  it("ignores whitespace on request", () => {
    const a = ["  x = 1;", "y"];
    const b = ["x   =   1;", "z"];
    expect(diffSequence(a, b)).toHaveLength(1);
    expect(diffSequence(a, b)[0]).toEqual({
      aStart: 0,
      aEnd: 2,
      bStart: 0,
      bEnd: 2,
    });
    expect(diffSequence(a, b, { ignoreWhitespace: true })).toEqual([
      { aStart: 1, aEnd: 2, bStart: 1, bEnd: 2 },
    ]);
  });

  it("keeps the diff valid when the cost limit is reached", () => {
    const a = Array.from({ length: 300 }, (_, i) => `x${i % 7}`);
    const b = Array.from({ length: 300 }, (_, i) => `x${(i * 3 + 1) % 7}`);
    const blocks = diffSequence(a, b, { maxCost: 4 });
    expect(apply(a, b, blocks)).toEqual(b);
    const best = diffSequence(a, b, { minimal: true });
    const size = (list: DiffBlock[]) =>
      list.reduce((n, d) => n + d.aEnd - d.aStart + d.bEnd - d.bStart, 0);
    expect(size(blocks)).toBeGreaterThanOrEqual(size(best));
  });

  it("diffs 10,000 lines with scattered edits quickly", () => {
    const a = Array.from({ length: 10_000 }, (_, i) => `line ${i}`);
    const b = a.slice();
    for (let i = 50; i < b.length; i += 400) b[i] = `${b[i]} edited`;
    b.splice(5000, 3);
    const start = performance.now();
    const blocks = diffSequence(a, b);
    const elapsed = performance.now() - start;
    expect(blocks).toHaveLength(25 + 1);
    expect(elapsed).toBeLessThan(200);
  });

  it("bounds a worst case where nothing lines up", () => {
    const a = Array.from({ length: 4000 }, (_, i) => `x${i % 40}`);
    const b = Array.from({ length: 4000 }, (_, i) => `x${(i * 7 + 3) % 40}`);
    const start = performance.now();
    const blocks = diffSequence(a, b);
    expect(performance.now() - start).toBeLessThan(2000);
    expect(apply(a, b, blocks)).toEqual(b);
  });
});

describe("diffInline", () => {
  it("marks the words that changed on each side", () => {
    const result = diffInline(
      "const foo = bar(1, 2);",
      "const foo = baz(1, 3);",
    );
    expect(result).toEqual({ old: [12, 15, 19, 20], new: [12, 15, 19, 20] });
  });

  it("marks added words on the new side only", () => {
    const result = diffInline("return value;", "return await value;");
    expect(result?.old).toEqual([]);
    expect(result?.new).toEqual([7, 13]);
  });

  it("joins words split only by space", () => {
    const result = diffInline("alpha beta gamma", "one two gamma");
    expect(result).toEqual({ old: [0, 10], new: [0, 7] });
  });

  it("returns null for lines with little in common", () => {
    expect(diffInline("return x;", "throw new Error('boom');")).toBeNull();
  });

  it("returns null for lines over the length limit", () => {
    const long = "word ".repeat(300);
    expect(diffInline(long, `${long}more`)).toBeNull();
    expect(diffInline(long, `${long}more`, { maxLength: 5000 })).not.toBeNull();
  });

  it("treats a word in any script as one token", () => {
    const result = diffInline("let größe = 1;", "let breite = 1;");
    expect(result?.old).toEqual([4, 9]);
    expect(result?.new).toEqual([4, 10]);
  });
});
