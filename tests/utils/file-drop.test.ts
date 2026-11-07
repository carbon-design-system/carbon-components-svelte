// @vitest-environment node
import {
  hasDraggedFiles,
  readDroppedFiles,
  readInputFiles,
} from "../../src/utils/file-drop.js";

type Entry = {
  name: string;
  isFile: boolean;
  isDirectory: boolean;
  file?: (ok: (file: File) => void) => void;
  createReader?: () => { readEntries: (ok: (e: Entry[]) => void) => void };
};

const file = (name: string): Entry => ({
  name,
  isFile: true,
  isDirectory: false,
  file: (ok) => ok(new File(["x"], name)),
});

// Hands back two entries at a time, as Chromium pages its batches.
const folder = (name: string, children: Entry[]): Entry => ({
  name,
  isFile: false,
  isDirectory: true,
  createReader: () => {
    let at = 0;
    return {
      readEntries: (ok) => {
        const batch = children.slice(at, at + 2);
        at += 2;
        ok(batch);
      },
    };
  },
});

const drop = (entries: Entry[]) =>
  ({
    items: entries.map((entry) => ({
      kind: "file",
      webkitGetAsEntry: () => entry,
      getAsFile: () => null,
    })),
    files: [],
  }) as unknown as DataTransfer;

describe("readDroppedFiles", () => {
  it("walks a folder past its first batch", async () => {
    const tree = folder("photos", [
      file("a.png"),
      file("b.png"),
      file("c.png"),
      folder("2024", [file("d.png")]),
      folder("empty", []),
    ]);
    const { files, folders } = await readDroppedFiles(
      drop([tree, file("x.txt")]),
    );
    expect(files.map((f) => f.path)).toEqual([
      "photos/a.png",
      "photos/b.png",
      "photos/c.png",
      "photos/2024/d.png",
      "x.txt",
    ]);
    expect(folders).toEqual(["photos", "photos/2024", "photos/empty"]);
  });

  it("keeps the File when its entry cannot be reopened", async () => {
    const broken: Entry = {
      name: "a.txt",
      isFile: true,
      isDirectory: false,
      file: () => {
        throw new Error("Path does not exist");
      },
    };
    const dt = {
      items: [
        {
          kind: "file",
          webkitGetAsEntry: () => broken,
          getAsFile: () => new File(["x"], "a.txt"),
        },
      ],
      files: [],
    } as unknown as DataTransfer;
    expect((await readDroppedFiles(dt)).files.map((f) => f.path)).toEqual([
      "a.txt",
    ]);
  });

  it("falls back to the file list without entries", async () => {
    const dt = {
      items: [],
      files: [new File(["x"], "a.txt")],
    } as unknown as DataTransfer;
    expect((await readDroppedFiles(dt)).files.map((f) => f.path)).toEqual([
      "a.txt",
    ]);
  });
});

describe("readInputFiles", () => {
  it("reads the folders out of webkitRelativePath", () => {
    const a = new File(["x"], "a.png");
    Object.defineProperty(a, "webkitRelativePath", {
      value: "pics/2024/a.png",
    });
    const b = new File(["x"], "b.png");
    Object.defineProperty(b, "webkitRelativePath", { value: "pics/b.png" });
    const out = readInputFiles([a, b]);
    expect(out.folders).toEqual(["pics", "pics/2024"]);
    expect(out.files.map((f) => f.path)).toEqual([
      "pics/2024/a.png",
      "pics/b.png",
    ]);
  });
});

describe("hasDraggedFiles", () => {
  it("reads types", () => {
    expect(
      hasDraggedFiles({ types: ["Files"] } as unknown as DataTransfer),
    ).toBe(true);
    expect(
      hasDraggedFiles({ types: ["text/plain"] } as unknown as DataTransfer),
    ).toBe(false);
    expect(hasDraggedFiles(null)).toBe(false);
  });
});
