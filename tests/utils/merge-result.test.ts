// @vitest-environment node
import {
  acceptChunk,
  applyEntry,
  chunkAt,
  chunkOffsets,
  chunkStatus,
  coalesceEntries,
  createMergeResult,
  diffRange,
  editText,
  invertEntry,
  neighborConflict,
  resultText,
  unresolvedCount,
} from "../../src/utils/merge-result.js";
import { merge3, parseConflictMarkers } from "../../src/utils/merge3.js";

const lines = (...rows: string[]) => `${rows.join("\n")}\n`;

const base = lines("a", "b", "c", "d", "e", "f", "g");
const ours = lines("a", "b", "ours1", "d", "e", "ours2", "g");
const theirs = lines("a", "b", "theirs1", "d", "e", "theirs2", "g");

function setup() {
  return createMergeResult(merge3(base, ours, theirs));
}

type Result = ReturnType<typeof setup>;

function applyTyping(
  result: Result,
  start: number,
  end: number,
  insert: string,
) {
  const entry = editText(result, start, end, insert);
  applyEntry(result, entry);
  return entry;
}

function accept(
  result: Result,
  index: number,
  choice: Parameters<typeof acceptChunk>[2],
) {
  const entry = acceptChunk(result, index, choice);
  if (entry) applyEntry(result, entry);
  return entry;
}

describe("createMergeResult", () => {
  it("starts with markers for each conflict and merged text elsewhere", () => {
    const result = setup();
    expect(unresolvedCount(result)).toBe(2);
    expect(resultText(result)).toBe(
      lines(
        "a",
        "b",
        "<<<<<<<",
        "ours1",
        "=======",
        "theirs1",
        ">>>>>>>",
        "d",
        "e",
        "<<<<<<<",
        "ours2",
        "=======",
        "theirs2",
        ">>>>>>>",
        "g",
      ),
    );
  });

  it("holds no newline at the end when the files had none", () => {
    const result = createMergeResult(merge3("a\nb", "a\nB", "a\nb"));
    expect(resultText(result)).toBe("a\nB");
  });
});

describe("acceptChunk", () => {
  it("replaces only that conflict's text and reads the status from the text", () => {
    const result = setup();
    accept(result, 1, "theirs");
    expect(chunkStatus(result, 1)).toBe("theirs");
    expect(unresolvedCount(result)).toBe(1);
    expect(resultText(result).startsWith(lines("a", "b", "theirs1", "d"))).toBe(
      true,
    );
    accept(result, 3, "both");
    expect(chunkStatus(result, 3)).toBe("both");
    expect(resultText(result)).toContain(lines("ours2", "theirs2", "g"));
    accept(result, 3, "both-reversed");
    expect(chunkStatus(result, 3)).toBe("both-reversed");
    expect(resultText(result)).toContain(lines("theirs2", "ours2", "g"));
    accept(result, 3, "base");
    expect(resultText(result)).toContain(lines("e", "f", "g"));
    expect(chunkStatus(result, 3)).toBe("base");
  });

  it("returns null for base without a base and for the text already there", () => {
    const parsed = createMergeResult(
      parseConflictMarkers(lines("<<<<<<<", "x", "=======", "y", ">>>>>>>")),
    );
    expect(accept(parsed, 0, "base")).toBeNull();
    expect(accept(parsed, 0, "ours")).not.toBeNull();
    expect(accept(parsed, 0, "ours")).toBeNull();
  });

  it("undoes by swapping the entry", () => {
    const result = setup();
    const before = resultText(result);
    const entry = accept(result, 1, "ours");
    expect(chunkStatus(result, 1)).toBe("ours");
    assert(entry);
    const patch = applyEntry(result, invertEntry(entry));
    expect(resultText(result)).toBe(before);
    expect(chunkStatus(result, 1)).toBe("unresolved");
    expect(patch.text).toBe(
      lines("<<<<<<<", "ours1", "=======", "theirs1", ">>>>>>>"),
    );
  });
});

describe("editText", () => {
  it("keeps conflicts in place as lines are added above them", () => {
    const result = setup();
    applyTyping(result, 0, 0, "new first line\n");
    applyTyping(result, 16, 16, "xx");
    const second = result.chunks.findIndex(
      (chunk, i) => i > 1 && chunk.type === "conflict",
    );
    accept(result, second, "theirs");
    expect(chunkStatus(result, second)).toBe("theirs");
    expect(resultText(result)).toContain(lines("e", "theirs2", "g"));
    expect(resultText(result).startsWith("new first line\naxx")).toBe(true);
  });

  it("marks a conflict edited when its lines are typed over, and resolved when markers go", () => {
    const result = setup();
    const offsets = chunkOffsets(result);
    const start = offsets[1];
    const end = offsets[2];
    applyTyping(result, start, end, "custom\n");
    expect(chunkStatus(result, 1)).toBe("edited");
    expect(unresolvedCount(result)).toBe(1);
  });

  it("keeps a conflict unresolved while a marker line remains in it", () => {
    const result = setup();
    const offsets = chunkOffsets(result);
    applyTyping(result, offsets[1] + 8, offsets[1] + 14, "changed");
    expect(chunkStatus(result, 1)).toBe("unresolved");
  });

  it("gives an insertion at a boundary to the later chunk and one before the newline to the earlier", () => {
    const result = setup();
    const offsets = chunkOffsets(result);
    const entry = applyTyping(result, offsets[2], offsets[2], "x");
    expect(entry).toMatchObject({ kind: "edit", chunk: 2, at: 0 });
    const inside = applyTyping(result, offsets[2] - 1, offsets[2] - 1, "y");
    expect(inside).toMatchObject({ kind: "edit", chunk: 1 });
    expect(chunkStatus(result, 1)).toBe("unresolved");
  });

  it("trims every chunk a range spans and undoes all of them", () => {
    const result = setup();
    const before = resultText(result);
    const offsets = chunkOffsets(result);
    const entry = applyTyping(result, offsets[1] + 3, offsets[3] + 1, "|");
    expect(entry.kind).toBe("span");
    expect(result.chunks[2].text).toBe("");
    expect(resultText(result)).toBe(
      `${before.slice(0, offsets[1] + 3)}|${before.slice(offsets[3] + 1)}`,
    );
    const patch = applyEntry(result, invertEntry(entry));
    expect(patch.start).toBe(offsets[1]);
    expect(resultText(result)).toBe(before);
  });

  it("resolves a deleted conflict to nothing, still in its place", () => {
    const result = setup();
    const offsets = chunkOffsets(result);
    applyTyping(result, offsets[1], offsets[2], "");
    expect(chunkStatus(result, 1)).toBe("edited");
    expect(unresolvedCount(result)).toBe(1);
    const entry = accept(result, 1, "ours");
    expect(entry).toMatchObject({ kind: "edit", chunk: 1 });
    expect(resultText(result)).toContain(lines("b", "ours1", "d"));
  });

  it("puts text typed at the very end in the last chunk with text", () => {
    const result = createMergeResult(merge3("a\n", "a\nb\n", "a\n"));
    applyTyping(result, 4, 4, "c");
    expect(resultText(result)).toBe("a\nb\nc");
    expect(chunkAt(chunkOffsets(result), 5)).toBe(result.chunks.length - 1);
  });
});

describe("diffRange", () => {
  it("finds the replaced range and holds the start at the caret", () => {
    expect(diffRange("hello", "heXllo")).toEqual({
      start: 2,
      end: 2,
      insert: "X",
    });
    expect(diffRange("aa", "aaa", 1)).toEqual({
      start: 1,
      end: 1,
      insert: "a",
    });
    expect(diffRange("abcd", "ad")).toEqual({ start: 1, end: 3, insert: "" });
    expect(diffRange("same", "same")).toEqual({ start: 4, end: 4, insert: "" });
  });
});

describe("coalesceEntries", () => {
  it("joins typing that continues and backspacing that continues, not the rest", () => {
    const type = (at: number, insert: string) => ({
      kind: "edit" as const,
      chunk: 0,
      at,
      remove: "",
      insert,
    });
    expect(coalesceEntries(type(3, "a"), type(4, "b"))).toMatchObject({
      at: 3,
      insert: "ab",
    });
    expect(coalesceEntries(type(3, "a"), type(9, "b"))).toBeNull();
    expect(coalesceEntries(type(3, "a"), type(4, "\n"))).toBeNull();
    const erase = (at: number, remove: string) => ({
      kind: "edit" as const,
      chunk: 0,
      at,
      remove,
      insert: "",
    });
    expect(coalesceEntries(erase(5, "x"), erase(4, "y"))).toMatchObject({
      at: 4,
      remove: "yx",
    });
  });
});

describe("neighborConflict", () => {
  it("walks the conflicts and wraps, optionally skipping resolved ones", () => {
    const result = setup();
    expect(neighborConflict(result, -1, 1)).toBe(1);
    expect(neighborConflict(result, 1, 1)).toBe(3);
    expect(neighborConflict(result, 3, 1)).toBe(1);
    expect(neighborConflict(result, 1, -1)).toBe(3);
    accept(result, 3, "ours");
    expect(neighborConflict(result, 1, 1, true)).toBe(1);
    expect(neighborConflict(result, 1, 1)).toBe(3);
    accept(result, 1, "ours");
    expect(neighborConflict(result, 1, 1, true)).toBe(-1);
  });
});
