import {
  fileIdentityKey,
  filterIncomingFiles,
} from "../../src/utils/filterIncomingFiles.js";

function makeFile(name: string, size: number, lastModified = 1) {
  const file = new File(["x".repeat(size)], name, { type: "text/plain" });
  Object.defineProperty(file, "lastModified", { value: lastModified });
  return file;
}

describe("fileIdentityKey", () => {
  test("joins name, size, and lastModified", () => {
    const file = makeFile("a.txt", 3, 42);
    expect(fileIdentityKey(file)).toBe("a.txt\u00003\u000042");
  });
});

describe("filterIncomingFiles", () => {
  test("accepts all files when no options are set", () => {
    const a = makeFile("a.txt", 10);
    const b = makeFile("b.txt", 20);
    const { accepted, rejected } = filterIncomingFiles([a, b]);
    expect(accepted).toEqual([a, b]);
    expect(rejected).toEqual([]);
  });

  test("rejects oversized files with reason size", () => {
    const small = makeFile("small.txt", 500);
    const large = makeFile("large.txt", 2000);
    const { accepted, rejected } = filterIncomingFiles([small, large], {
      maxFileSize: 1000,
    });
    expect(accepted).toEqual([small]);
    expect(rejected).toEqual([{ file: large, reason: "size" }]);
  });

  test("accepts files at exactly maxFileSize", () => {
    const exact = makeFile("exact.txt", 1000);
    const { accepted, rejected } = filterIncomingFiles([exact], {
      maxFileSize: 1000,
    });
    expect(accepted).toEqual([exact]);
    expect(rejected).toEqual([]);
  });

  test("honors a maxFileSize of 0", () => {
    const empty = makeFile("empty.txt", 0);
    const nonEmpty = makeFile("a.txt", 1);
    const { accepted, rejected } = filterIncomingFiles([empty, nonEmpty], {
      maxFileSize: 0,
    });
    expect(accepted).toEqual([empty]);
    expect(rejected).toEqual([{ file: nonEmpty, reason: "size" }]);
  });

  test("rejects duplicates against existing files", () => {
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

  test("does not reject same-reference files in carryRefs", () => {
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

  test("applies size before duplicate", () => {
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
