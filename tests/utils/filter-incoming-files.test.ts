import {
  fileIdentityKey,
  filterIncomingFiles,
  matchesAccept,
} from "../../src/utils/filter-incoming-files.js";

function makeFile(name: string, size: number, lastModified = 1) {
  const file = new File(["x".repeat(size)], name, { type: "text/plain" });
  Object.defineProperty(file, "lastModified", { value: lastModified });
  return file;
}

describe("fileIdentityKey", () => {
  it("joins name, size, and lastModified", () => {
    const file = makeFile("a.txt", 3, 42);
    expect(fileIdentityKey(file)).toBe("a.txt\u00003\u000042");
  });
});

describe("filterIncomingFiles", () => {
  it("accepts all files when no options are set", () => {
    const a = makeFile("a.txt", 10);
    const b = makeFile("b.txt", 20);
    const { accepted, rejected } = filterIncomingFiles([a, b]);
    expect(accepted).toEqual([a, b]);
    expect(rejected).toEqual([]);
  });

  it("rejects oversized files with reason size", () => {
    const small = makeFile("small.txt", 500);
    const large = makeFile("large.txt", 2000);
    const { accepted, rejected } = filterIncomingFiles([small, large], {
      maxFileSize: 1000,
    });
    expect(accepted).toEqual([small]);
    expect(rejected).toEqual([{ file: large, reason: "size" }]);
  });

  it("accepts files at exactly maxFileSize", () => {
    const exact = makeFile("exact.txt", 1000);
    const { accepted, rejected } = filterIncomingFiles([exact], {
      maxFileSize: 1000,
    });
    expect(accepted).toEqual([exact]);
    expect(rejected).toEqual([]);
  });

  it("rejects files under minFileSize with reason size", () => {
    const empty = makeFile("empty.txt", 0);
    const exact = makeFile("one.txt", 1);
    const { accepted, rejected } = filterIncomingFiles([empty, exact], {
      minFileSize: 1,
    });
    expect(accepted).toEqual([exact]);
    expect(rejected).toEqual([{ file: empty, reason: "size" }]);
  });

  it("honors a maxFileSize of 0", () => {
    const empty = makeFile("empty.txt", 0);
    const nonEmpty = makeFile("a.txt", 1);
    const { accepted, rejected } = filterIncomingFiles([empty, nonEmpty], {
      maxFileSize: 0,
    });
    expect(accepted).toEqual([empty]);
    expect(rejected).toEqual([{ file: nonEmpty, reason: "size" }]);
  });

  it("rejects duplicates against existing files", () => {
    const existing = makeFile("dup.txt", 10, 5);
    const duplicate = makeFile("dup.txt", 10, 5);
    const unique = makeFile("new.txt", 10, 5);
    const { accepted, rejected } = filterIncomingFiles([duplicate, unique], {
      preventDuplicate: true,
      existingFiles: [existing],
    });
    expect(accepted).toEqual([unique]);
    expect(rejected).toEqual([{ file: duplicate, reason: "duplicate" }]);
  });

  it("does not reject same-reference files in carryRefs", () => {
    const existing = makeFile("kept.txt", 10, 5);
    const fresh = makeFile("kept.txt", 10, 5);
    const { accepted, rejected } = filterIncomingFiles([existing, fresh], {
      preventDuplicate: true,
      existingFiles: [existing],
      carryRefs: new Set([existing]),
    });
    expect(accepted).toEqual([existing]);
    expect(rejected).toEqual([{ file: fresh, reason: "duplicate" }]);
  });

  it("applies size before duplicate", () => {
    const existing = makeFile("big.txt", 2000, 1);
    const oversizedDup = makeFile("big.txt", 2000, 1);
    const { accepted, rejected } = filterIncomingFiles([oversizedDup], {
      maxFileSize: 1000,
      preventDuplicate: true,
      existingFiles: [existing],
    });
    expect(accepted).toEqual([]);
    expect(rejected).toEqual([{ file: oversizedDup, reason: "size" }]);
  });
});

describe("matchesAccept", () => {
  const file = (name: string, type: string) => new File(["x"], name, { type });

  it("accepts every file for an empty list", () => {
    expect(matchesAccept(file("a.bin", ""), [])).toBe(true);
    expect(matchesAccept(file("a.bin", "text/plain"), "")).toBe(true);
  });

  it("matches extensions case-insensitively", () => {
    expect(matchesAccept(file("Logo.PNG", "image/png"), [".png"])).toBe(true);
    expect(matchesAccept(file("notes.txt", "text/plain"), [".png"])).toBe(
      false,
    );
  });

  it("matches MIME types and wildcards", () => {
    expect(matchesAccept(file("a", "image/jpeg"), ["image/jpeg"])).toBe(true);
    expect(matchesAccept(file("a", "image/webp"), ["image/*"])).toBe(true);
    expect(matchesAccept(file("a", "text/plain"), ["image/*"])).toBe(false);
    expect(matchesAccept(file("a", ""), ["image/*"])).toBe(false);
  });

  it("splits a comma-separated string", () => {
    expect(matchesAccept(file("a.pdf", ""), "image/*, .pdf")).toBe(true);
  });
});

describe("filterIncomingFiles accept", () => {
  it("rejects files outside accept with reason type", () => {
    const png = new File(["x"], "a.png", { type: "image/png" });
    const txt = new File(["x"], "b.txt", { type: "text/plain" });
    expect(filterIncomingFiles([png, txt], { accept: [".png"] })).toEqual({
      accepted: [png],
      rejected: [{ file: txt, reason: "type" }],
    });
  });
});
