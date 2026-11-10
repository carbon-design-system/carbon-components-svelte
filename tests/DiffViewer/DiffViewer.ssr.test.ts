// @vitest-environment node
import { tokenize } from "../../src/syntax/index.js";
import { renderSSR } from "../utils/ssr";
import DiffViewer from "./DiffViewer.test.svelte";

const OLD = "const a = 1;\nconst b = 2;\nconst c = 3;";
const NEW = "const a = 1;\nconst b = 20;\nconst c = 3;";

describe("DiffViewer server render", () => {
  it("renders the rows, the signs and the hidden text without script", () => {
    const { document } = renderSSR(DiffViewer, {
      oldText: OLD,
      newText: NEW,
      view: "unified",
      toolbar: false,
    });

    const group = document.querySelector('[role="group"]');
    expect(group?.getAttribute("aria-label")).toBe("Diff");
    const rows = [...document.querySelectorAll(".bx--diff-viewer__row")];
    expect(
      rows.map(
        (row) => row.querySelector(".bx--diff-viewer__code")?.textContent,
      ),
    ).toEqual([
      undefined,
      "const a = 1;",
      "const b = 2;",
      "const b = 20;",
      "const c = 3;",
    ]);
    expect(
      [...document.querySelectorAll(".bx--diff-viewer__sr")].map(
        (el) => el.textContent,
      ),
    ).toEqual(["Removed line 2", "Added line 2"]);
  });

  it("renders only the first window of a long diff", () => {
    const old = Array.from({ length: 5000 }, (_, i) => `line ${i}`);
    const next = old.slice();
    next[10] = "changed";
    const { document } = renderSSR(DiffViewer, {
      oldText: old.join("\n"),
      newText: next.join("\n"),
      collapseUnchanged: false,
      height: 300,
    });

    const rows = document.querySelectorAll(".bx--diff-viewer__row").length;
    expect(rows).toBeGreaterThan(10);
    expect(rows).toBeLessThan(80);
  });

  it("colors code on the server when given a tokenizer", () => {
    const { document } = renderSSR(DiffViewer, {
      oldText: "let a = 1;",
      newText: "let a = 2;",
      language: "js",
      tokenize,
      toolbar: false,
    });

    expect(document.querySelectorAll("[class^=tok-]").length).toBeGreaterThan(
      0,
    );
  });
});
