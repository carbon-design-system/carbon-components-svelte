import {
  type Chunk,
  pageManifest,
  preloadScript,
  preloadsFor,
} from "../../docs/scripts/page-html";

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

describe("preloadScript", () => {
  afterEach(() => {
    document.head.replaceChildren();
    history.replaceState(null, "", "/");
  });

  it("preloads the app and the current page's files from the manifest", () => {
    const manifest = pageManifest(
      new Map([
        ["/components/Button", [["modulepreload", "/assets/button.js"]]],
        [
          "/components/Modal",
          [
            ["modulepreload", "/assets/button.js"],
            ["preload", "/assets/modal.css"],
          ],
        ],
      ]),
    );
    expect(manifest).toEqual({
      files: ["assets/button.js", "assets/modal.css"],
      pages: { "/components/Button": [0], "/components/Modal": [0, 1] },
    });
    history.replaceState(null, "", "/components/Modal/");

    new Function(
      preloadScript([["modulepreload", "/assets/app.js"]], manifest, "/"),
    )();

    const links = () =>
      [...document.head.querySelectorAll("link")].map((link) => [
        link.rel,
        link.getAttribute("href"),
      ]);
    expect(links()).toEqual([
      ["modulepreload", "/assets/app.js"],
      ["modulepreload", "/assets/button.js"],
      ["preload", "/assets/modal.css"],
    ]);
  });
});
