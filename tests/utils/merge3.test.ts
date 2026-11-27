// @vitest-environment node
import {
  conflictMarkerLines,
  diffHunks,
  isConflictMarker,
  merge3,
  parseConflictMarkers,
  splitText,
  wordDiff,
} from "../../src/utils/merge3.js";

const lines = (...rows: string[]) => `${rows.join("\n")}\n`;

const types = (model: ReturnType<typeof merge3>) =>
  model.chunks.map((chunk) => chunk.type);

describe("splitText", () => {
  it("separates lines from the line ending and the final newline", () => {
    expect(splitText("a\nb\n")).toEqual({
      lines: ["a", "b"],
      eol: "\n",
      finalNewline: true,
    });
    expect(splitText("a\r\nb")).toEqual({
      lines: ["a", "b"],
      eol: "\r\n",
      finalNewline: false,
    });
  });

  it("treats empty text as no lines and a lone newline as one empty line", () => {
    expect(splitText("")).toEqual({
      lines: [],
      eol: "\n",
      finalNewline: false,
    });
    expect(splitText("\n").lines).toEqual([""]);
  });

  it("picks the ending most lines use", () => {
    expect(splitText("a\r\nb\r\nc\n").eol).toBe("\r\n");
    expect(splitText("a\nb\nc\r\n").eol).toBe("\n");
  });
});

describe("diffHunks", () => {
  it("finds one hunk for scattered unequal runs and none for equal input", () => {
    expect(diffHunks([1, 2, 3], [1, 2, 3])).toEqual([]);
    expect(diffHunks([1, 2, 3, 4], [1, 9, 3, 4])).toEqual([
      { aStart: 1, aEnd: 2, bStart: 1, bEnd: 2 },
    ]);
  });

  it("matches around moved lines through the common subsequence", () => {
    expect(diffHunks([1, 2, 3, 4, 5], [1, 3, 4, 2, 5])).toEqual([
      { aStart: 1, aEnd: 2, bStart: 1, bEnd: 1 },
      { aStart: 4, aEnd: 4, bStart: 3, bEnd: 4 },
    ]);
  });

  it("settles for one replaced stretch past the cost cap", () => {
    const a = Array.from({ length: 40 }, (_, i) => i % 5);
    const b = Array.from({ length: 40 }, (_, i) => (i + 2) % 5);
    const capped = diffHunks(a, b, 2);
    expect(capped).toEqual([{ aStart: 0, aEnd: 40, bStart: 0, bEnd: 40 }]);
  });
});

describe("merge3", () => {
  const base = lines("a", "b", "c", "d", "e", "f");

  it("is one unchanged chunk when nothing changed", () => {
    const model = merge3(base, base, base);
    expect(types(model)).toEqual(["unchanged"]);
  });

  it("keeps changes that don't overlap, one chunk per side", () => {
    const ours = lines("a", "B", "c", "d", "e", "f");
    const theirs = lines("a", "b", "c", "d", "E", "f");
    const model = merge3(base, ours, theirs);
    expect(types(model)).toEqual([
      "unchanged",
      "ours",
      "unchanged",
      "theirs",
      "unchanged",
    ]);
    expect(model.chunks[1].ours).toEqual(["B"]);
    expect(model.chunks[1].base).toEqual(["b"]);
    expect(model.chunks[3].theirs).toEqual(["E"]);
  });

  it("calls the same change on both sides both, not a conflict", () => {
    const edit = lines("a", "b", "X", "d", "e", "f");
    expect(types(merge3(base, edit, edit))).toEqual([
      "unchanged",
      "both",
      "unchanged",
    ]);
  });

  it("calls different changes to the same lines a conflict", () => {
    const ours = lines("a", "b", "ours", "d", "e", "f");
    const theirs = lines("a", "b", "theirs", "d", "e", "f");
    const model = merge3(base, ours, theirs);
    expect(types(model)).toEqual(["unchanged", "conflict", "unchanged"]);
    expect(model.chunks[1]).toEqual({
      type: "conflict",
      base: ["c"],
      ours: ["ours"],
      theirs: ["theirs"],
    });
  });

  it("makes changes that touch one conflict, as git does", () => {
    const ours = lines("a", "B", "c", "d", "e", "f");
    const theirs = lines("a", "b", "C", "d", "e", "f");
    const model = merge3(base, ours, theirs);
    expect(types(model)).toEqual(["unchanged", "conflict", "unchanged"]);
    expect(model.chunks[1].base).toEqual(["b", "c"]);
    expect(model.chunks[1].ours).toEqual(["B", "c"]);
    expect(model.chunks[1].theirs).toEqual(["b", "C"]);
  });

  it("keeps edits one line apart separate", () => {
    const ours = lines("A", "b", "c", "d", "e", "f");
    const theirs = lines("a", "b", "C", "d", "e", "f");
    expect(types(merge3(base, ours, theirs))).toEqual([
      "ours",
      "unchanged",
      "theirs",
      "unchanged",
    ]);
  });

  it("conflicts an edit against a deletion of the same line", () => {
    const ours = lines("a", "b", "d", "e", "f");
    const theirs = lines("a", "b", "C", "d", "e", "f");
    const model = merge3(base, ours, theirs);
    const conflict = model.chunks.find((chunk) => chunk.type === "conflict");
    expect(conflict?.ours).toEqual([]);
    expect(conflict?.theirs).toEqual(["C"]);
  });

  it("conflicts two different insertions at one spot", () => {
    const ours = lines("a", "b", "x", "c", "d", "e", "f");
    const theirs = lines("a", "b", "y", "c", "d", "e", "f");
    const model = merge3(base, ours, theirs);
    const conflict = model.chunks.find((chunk) => chunk.type === "conflict");
    expect(conflict?.base).toEqual([]);
    expect(conflict?.ours).toEqual(["x"]);
    expect(conflict?.theirs).toEqual(["y"]);
  });

  it("covers every line of all three texts exactly once", () => {
    const ours = lines("a", "b2", "c", "n1", "n2", "d", "f");
    const theirs = lines("a0", "a", "b", "c3", "d", "e", "f");
    const model = merge3(base, ours, theirs);
    const rebuild = (key: "base" | "ours" | "theirs") =>
      model.chunks.flatMap((chunk) => chunk[key] ?? []).join("\n");
    expect(rebuild("base")).toBe(base.trim());
    expect(rebuild("ours")).toBe(ours.trim());
    expect(rebuild("theirs")).toBe(theirs.trim());
  });

  it("handles empty files", () => {
    const model = merge3("", "x\n", "");
    expect(types(model)).toEqual(["ours"]);
    expect(types(merge3("", "", ""))).toEqual([]);
    expect(types(merge3("", "x\n", "y\n"))).toEqual(["conflict"]);
  });

  it("merges the final newline apart from the lines", () => {
    const dropped = merge3("a\n", "a\n", "a");
    expect(types(dropped)).toEqual(["unchanged"]);
    expect(dropped.finalNewline).toBe(false);
    expect(merge3("a", "a\n", "a").finalNewline).toBe(true);
    expect(merge3("a\n", "a", "a\n").finalNewline).toBe(false);
    expect(merge3("a", "a", "a").finalNewline).toBe(false);
  });

  it("compares lines without their line endings and picks the ending that changed", () => {
    const crlf = "a\r\nb\r\nc\r\n";
    const model = merge3(crlf, "a\r\nB\r\nc\r\n", "a\nb\nc\n");
    expect(types(model)).toEqual(["unchanged", "ours", "unchanged"]);
    expect(model.eol).toBe("\n");
    expect(merge3(crlf, crlf, crlf).eol).toBe("\r\n");
    expect(merge3("a\nb\n", "a\r\nb\r\n", "a\nb\n").eol).toBe("\r\n");
  });

  it("diffs a very long line by its identity, not its length", () => {
    const long = "x".repeat(200_000);
    const model = merge3(
      lines("a", long, "b", "c"),
      lines("a", `${long}1`, "b", "c"),
      lines("a", long, "b", "c2"),
    );
    expect(types(model)).toEqual(["unchanged", "ours", "unchanged", "theirs"]);
  });

  it("merges 10,000 lines with 50 conflicts in well under a second", () => {
    const rows = Array.from({ length: 10_000 }, (_, i) => `line ${i}`);
    const ours = [...rows];
    const theirs = [...rows];
    for (let k = 0; k < 50; k++) {
      ours[k * 200 + 10] = `ours ${k}`;
      theirs[k * 200 + 10] = `theirs ${k}`;
      ours[k * 200 + 100] = `only ours ${k}`;
    }
    const start = performance.now();
    const model = merge3(lines(...rows), lines(...ours), lines(...theirs));
    const elapsed = performance.now() - start;
    expect(
      model.chunks.filter((chunk) => chunk.type === "conflict"),
    ).toHaveLength(50);
    expect(model.chunks.filter((chunk) => chunk.type === "ours")).toHaveLength(
      50,
    );
    expect(elapsed).toBeLessThan(1000);
  });
});

describe("merge3 against a reference", () => {
  it("equals both edit sets applied to the base when no edits touch", () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let round = 0; round < 40; round++) {
      const rows = Array.from({ length: 60 }, (_, i) => `row ${i}`);
      const ours = [...rows];
      const theirs = [...rows];
      const expected = [...rows];
      for (let at = 1; at < 58; at += 3) {
        const roll = random();
        if (roll < 0.25) {
          ours[at] = `ours ${at}`;
          expected[at] = ours[at];
        } else if (roll < 0.5) {
          theirs[at] = `theirs ${at}`;
          expected[at] = theirs[at];
        } else if (roll < 0.6) {
          ours[at] = `${rows[at]}\nadded ${at}`;
          expected[at] = ours[at];
        }
      }
      const model = merge3(lines(...rows), lines(...ours), lines(...theirs));
      expect(model.chunks.some((chunk) => chunk.type === "conflict")).toBe(
        false,
      );
      const merged = model.chunks.flatMap((chunk) =>
        chunk.type === "theirs" ? chunk.theirs : chunk.ours,
      );
      expect(merged.join("\n")).toBe(expected.join("\n"));
    }
  });
});

describe("parseConflictMarkers", () => {
  const diff3 = lines(
    "a",
    "<<<<<<< HEAD",
    "ours",
    "||||||| base",
    "orig",
    "=======",
    "theirs",
    ">>>>>>> feature",
    "z",
  );

  it("turns each block into a conflict and the rest into unchanged text", () => {
    const model = parseConflictMarkers(diff3);
    expect(types(model)).toEqual(["unchanged", "conflict", "unchanged"]);
    expect(model.chunks[1]).toEqual({
      type: "conflict",
      base: ["orig"],
      ours: ["ours"],
      theirs: ["theirs"],
    });
    expect(model.hasBase).toBe(true);
    expect(model.labels).toEqual({
      ours: "HEAD",
      theirs: "feature",
      base: "base",
    });
  });

  it("has no base without the ||||||| section", () => {
    const model = parseConflictMarkers(
      lines("<<<<<<< HEAD", "x", "=======", "y", ">>>>>>> b"),
    );
    expect(model.chunks[0].base).toBeNull();
    expect(model.hasBase).toBe(false);
  });

  it("leaves a block that never closes as text", () => {
    const model = parseConflictMarkers(
      lines("<<<<<<< HEAD", "x", "=======", "y"),
    );
    expect(types(model)).toEqual(["unchanged"]);
  });

  it("keeps a setext underline inside a side", () => {
    const model = parseConflictMarkers(
      lines("<<<<<<<", "Title", "=======", "=======", "New", ">>>>>>>"),
    );
    expect(model.chunks[0].ours).toEqual(["Title"]);
    expect(model.chunks[0].theirs).toEqual(["=======", "New"]);
  });

  it("calls a block with equal sides both", () => {
    const model = parseConflictMarkers(
      lines("<<<<<<<", "same", "=======", "same", ">>>>>>>"),
    );
    expect(types(model)).toEqual(["both"]);
  });

  it("round trips through conflictMarkerLines", () => {
    const model = parseConflictMarkers(diff3);
    const block = conflictMarkerLines(model.chunks[1], model.labels);
    expect(block).toEqual(diff3.trim().split("\n").slice(1, -1));
  });

  it("reads CRLF files", () => {
    const model = parseConflictMarkers(diff3.replace(/\n/g, "\r\n"));
    expect(model.eol).toBe("\r\n");
    expect(model.chunks[1].ours).toEqual(["ours"]);
  });

  it("recognizes opener and closer lines", () => {
    expect(isConflictMarker("<<<<<<< HEAD")).toBe(true);
    expect(isConflictMarker(">>>>>>>")).toBe(true);
    expect(isConflictMarker("=======")).toBe(false);
    expect(isConflictMarker("<<<<<<<<")).toBe(false);
  });
});

describe("wordDiff", () => {
  it("marks the changed words on both lines", () => {
    const result = wordDiff("timeout: 30s", "timeout: 45s");
    expect(result).toEqual({ a: [[9, 12]], b: [[9, 12]] });
  });

  it("gives up on lines that share little or are too long", () => {
    expect(wordDiff("alpha beta gamma", "one two three")).toBeNull();
    expect(wordDiff("a".repeat(2000), "b".repeat(2000))).toBeNull();
  });
});
