// @vitest-environment node
import FileManager from "carbon-components-svelte/FileManager/FileManager.svelte";
import { createMemoryFileSystem } from "../../src/utils/file-system.js";
import { renderSSR } from "../utils/ssr";

describe("FileManager server render", () => {
  it("renders the frame, the tree and a loading state, with no browser API", () => {
    const { document } = renderSSR(FileManager, {
      adapter: createMemoryFileSystem(),
      id: "fm",
    });

    const root = document.querySelector("#fm");
    expect(root).toHaveAttribute("role", "group");
    expect(root).toHaveAttribute("aria-label", "Files");
    expect(document.querySelector('[role="tree"]')).not.toBeNull();
    expect(
      document.querySelector('[role="status"][aria-label="Loading files"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('nav[aria-label="Folder path"]'),
    ).toHaveTextContent("My files");
  });

  it("renders the toolbar controls and no details panel", () => {
    const { document } = renderSSR(FileManager, {
      adapter: createMemoryFileSystem(),
    });

    expect(
      [...document.querySelectorAll("button")].map((b) =>
        b.textContent?.trim(),
      ),
    ).toEqual(expect.arrayContaining(["Details"]));
    expect(document.querySelector(".bx--side-panel")).toBeNull();
  });
});
