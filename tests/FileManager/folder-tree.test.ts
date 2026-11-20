// @vitest-environment node
import {
  createFolderTree,
  setChildren,
} from "../../src/FileManager/folder-tree.js";

const folder = (path: string) => ({
  path,
  name: path.split("/").pop() as string,
  kind: "folder",
});
const file = (path: string) => ({ path, name: path.slice(1), kind: "file" });

describe("setChildren", () => {
  it("keeps folders only and drops the expander of a folder with none", () => {
    const { byId } = createFolderTree("Home");
    setChildren(byId, "/", [folder("/a"), file("/f.txt")]);
    expect(byId.get("/")?.nodes?.map((n) => n.id)).toEqual(["/a"]);
    expect(byId.get("/a")?.hasChildren).toBe(true);
    setChildren(byId, "/a", [file("/a/x.txt")]);
    expect(byId.get("/a")?.hasChildren).toBe(false);
    expect(byId.get("/a")?.nodes).toEqual([]);
  });

  it("keeps a loaded subfolder's own children when its parent reloads", () => {
    const { byId } = createFolderTree("Home");
    setChildren(byId, "/", [folder("/a")]);
    setChildren(byId, "/a", [folder("/a/b")]);
    const before = byId.get("/a");
    setChildren(byId, "/", [folder("/a"), folder("/c")]);
    expect(byId.get("/a")).toBe(before);
    expect(byId.get("/a")?.nodes?.[0].id).toBe("/a/b");
  });

  it("forgets a folder that left, with everything under it", () => {
    const { byId } = createFolderTree("Home");
    setChildren(byId, "/", [folder("/a")]);
    setChildren(byId, "/a", [folder("/a/b")]);
    setChildren(byId, "/", []);
    expect(byId.has("/a")).toBe(false);
    expect(byId.has("/a/b")).toBe(false);
  });

  it("marks the folders that cannot be chosen", () => {
    const { byId } = createFolderTree("Home");
    setChildren(byId, "/", [folder("/a"), folder("/b")], (p) => p === "/a");
    expect(byId.get("/a")?.disabled).toBe(true);
    expect(byId.get("/b")?.disabled).toBeUndefined();
  });

  it("ignores a folder that is not in the tree", () => {
    const { byId } = createFolderTree("Home");
    expect(setChildren(byId, "/nowhere", [folder("/x")])).toBe(false);
  });
});
