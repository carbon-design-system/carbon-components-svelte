// @vitest-environment node
import {
  baseName,
  createMemoryFileSystem,
  FileSystemError,
  isInside,
  joinPath,
  normalizePath,
  parentPath,
  pathTrail,
  sortEntries,
  uniqueName,
  validateName,
} from "../../src/utils/file-system.js";

describe("paths", () => {
  it("normalizes and joins", () => {
    expect(normalizePath("")).toBe("/");
    expect(normalizePath("a//b/")).toBe("/a/b");
    expect(joinPath("/", "a")).toBe("/a");
    expect(joinPath("/a", "b.txt")).toBe("/a/b.txt");
  });

  it("finds parent, base name and trail", () => {
    expect(parentPath("/a/b")).toBe("/a");
    expect(parentPath("/a")).toBe("/");
    expect(baseName("/a/b.txt")).toBe("b.txt");
    expect(baseName("/")).toBe("");
    expect(pathTrail("/a/b").map((step) => step.path)).toEqual([
      "/",
      "/a",
      "/a/b",
    ]);
  });

  it("tells inside from a prefix lookalike", () => {
    expect(isInside("/a/b", "/a")).toBe(true);
    expect(isInside("/a", "/a")).toBe(true);
    expect(isInside("/ab", "/a")).toBe(false);
    expect(isInside("/anything", "/")).toBe(true);
  });
});

describe("names", () => {
  it("keeps the extension when it numbers a copy", () => {
    const taken = new Set(["report.pdf", "report (2).pdf"]);
    expect(uniqueName("report.pdf", taken)).toBe("report (3).pdf");
    expect(uniqueName("new.txt", taken)).toBe("new.txt");
    expect(uniqueName("v1.2", new Set(["v1.2"]), { folder: true })).toBe(
      "v1.2 (2)",
    );
  });

  it("rejects names a file system would", () => {
    expect(validateName("  ")).toBe("empty");
    expect(validateName("a/b")).toBe("slash");
    expect(validateName("..")).toBe("dots");
    expect(validateName("a", new Set(["a"]))).toBe("exists");
    expect(validateName("a", new Set(["b"]))).toBe(null);
  });
});

describe("sortEntries", () => {
  const entries = [
    { path: "/file10", name: "file10", kind: "file", size: 5 },
    { path: "/file2", name: "file2", kind: "file", size: 9 },
    { path: "/zeta", name: "zeta", kind: "folder" },
    { path: "/none", name: "none", kind: "file" },
  ] as const;

  it("puts folders first in either direction", () => {
    expect(sortEntries(entries, "name").map((e) => e.name)).toEqual([
      "zeta",
      "file2",
      "file10",
      "none",
    ]);
    expect(
      sortEntries(entries, "name", "descending").map((e) => e.name),
    ).toEqual(["zeta", "none", "file10", "file2"]);
  });

  it("sorts by size and keeps entries without one last", () => {
    expect(sortEntries(entries, "size").map((e) => e.name)).toEqual([
      "zeta",
      "file10",
      "file2",
      "none",
    ]);
    expect(
      sortEntries(entries, "size", "descending").map((e) => e.name),
    ).toEqual(["zeta", "file2", "file10", "none"]);
  });
});

describe("createMemoryFileSystem", () => {
  const seed = () =>
    createMemoryFileSystem({
      entries: [
        { path: "/docs/a.txt", size: 3, content: "abc", type: "text/plain" },
        { path: "/docs/sub", kind: "folder" },
        { path: "/b.txt", size: 1 },
      ],
    });

  it("creates parent folders and lists one level", async () => {
    const fs = seed();
    const root = await fs.list("/");
    expect(root.map((e) => e.path).sort()).toEqual(["/b.txt", "/docs"]);
    expect((await fs.list("/docs")).map((e) => e.name).sort()).toEqual([
      "a.txt",
      "sub",
    ]);
  });

  it("moves a folder with its descendants and renames", async () => {
    const fs = seed();
    await fs.mkdir("/other");
    await fs.move("/docs", "/other/docs");
    expect((await fs.list("/other/docs")).map((e) => e.path).sort()).toEqual([
      "/other/docs/a.txt",
      "/other/docs/sub",
    ]);
    await expect(fs.list("/docs")).rejects.toMatchObject({
      code: "not-found",
    });
    await fs.move("/b.txt", "/c.txt");
    expect((await fs.stat("/c.txt")).name).toBe("c.txt");
  });

  it("refuses a move into itself and onto a name that exists", async () => {
    const fs = seed();
    await expect(fs.move("/docs", "/docs/sub/docs")).rejects.toMatchObject({
      code: "invalid",
    });
    await fs.mkdir("/x");
    await fs.upload(new File(["z"], "b.txt"), "/x/b.txt");
    await expect(fs.move("/x/b.txt", "/b.txt")).rejects.toMatchObject({
      code: "exists",
    });
  });

  it("removes a folder recursively", async () => {
    const fs = seed();
    await fs.remove("/docs");
    expect(await fs.list("/")).toHaveLength(1);
    await expect(fs.stat("/docs/a.txt")).rejects.toBeInstanceOf(
      FileSystemError,
    );
  });

  it("reports upload progress and can be aborted", async () => {
    const fs = createMemoryFileSystem({ latency: 1, uploadChunks: 4 });
    const seen: number[] = [];
    const entry = await fs.upload(new File(["12345678"], "n.txt"), "/n.txt", {
      onProgress: (loaded) => seen.push(loaded),
    });
    expect(seen).toEqual([2, 4, 6, 8]);
    expect(entry.size).toBe(8);

    const controller = new AbortController();
    const pending = fs.upload(new File(["1"], "m.txt"), "/m.txt", {
      signal: controller.signal,
    });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: "aborted" });
    await expect(fs.stat("/m.txt")).rejects.toMatchObject({
      code: "not-found",
    });
  });

  it("fails a call on demand", async () => {
    const fs = createMemoryFileSystem({
      fail: (operation, path) =>
        operation === "list" && path === "/bad"
          ? new FileSystemError("failed", "No access")
          : undefined,
      entries: [{ path: "/bad", kind: "folder" }],
    });
    await expect(fs.list("/bad")).rejects.toThrow("No access");
  });

  it("serves text content as a data URL", async () => {
    const url = await seed().url?.("/docs/a.txt");
    expect(url).toBe("data:text/plain;charset=utf-8,abc");
  });
});
