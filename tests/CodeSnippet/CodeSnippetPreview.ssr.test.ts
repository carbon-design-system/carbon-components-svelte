// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import CodeSnippetPreview from "./CodeSnippetPreview.test.svelte";

it("server-renders the preview and its bar in their final place", () => {
  const { document } = renderSSR(CodeSnippetPreview, { actions: true });
  const root = document.querySelector(".bx--snippet");
  expect(root?.classList.contains("bx--snippet--has-preview")).toBe(true);
  const preview = root?.firstElementChild;
  expect(preview?.className).toBe("bx--snippet__preview");
  const label = preview?.querySelector(".bx--snippet__preview-label");
  expect(label?.textContent).toBe("Preview");
  expect(preview?.getAttribute("aria-labelledby")).toBe(label?.id);
  expect(preview?.textContent).toContain("Save");
});
