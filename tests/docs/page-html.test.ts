// @vitest-environment node
import { type Chunk, preloadsFor } from "../../docs/scripts/page-html";

const chunk = (fileName: string, imports: string[], css: string[] = []) =>
  [
    fileName,
    {
      fileName,
      imports,
      isEntry: false,
      facadeModuleId: null,
      viteMetadata: { importedCss: new Set(css) },
    },
  ] as [string, Chunk];

describe("preloadsFor", () => {
  it("lists what a chunk loads beyond what's loaded, modules before styles", () => {
    const chunks = new Map([
      chunk("entry.js", ["utils.js"]),
      chunk("utils.js", []),
      chunk("app.js", ["utils.js", "header.js"], ["app.css"]),
      chunk("header.js", [], ["header.css"]),
      chunk("page.js", ["header.js", "table.js"]),
      chunk("table.js", [], ["table.css"]),
    ]);
    const loaded = new Set<string>();
    preloadsFor(chunks, "entry.js", loaded);

    expect(preloadsFor(chunks, "app.js", loaded, "/assets/")).toEqual([
      ["modulepreload", "/assets/app.js"],
      ["modulepreload", "/assets/header.js"],
      ["preload", "/assets/app.css"],
      ["preload", "/assets/header.css"],
    ]);
    expect(preloadsFor(chunks, "page.js", loaded, "/assets/")).toEqual([
      ["modulepreload", "/assets/page.js"],
      ["modulepreload", "/assets/table.js"],
      ["preload", "/assets/table.css"],
    ]);
  });
});
