// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Markdown from "./Markdown.test.svelte";

describe("Markdown server render", () => {
  it("renders the blocks, with no caret before the client takes over", () => {
    const { document } = renderSSR(Markdown, {
      source: "# Hi\n\nSome **text** and [a link](https://example.com).",
    });

    expect(document.querySelector("h3")?.textContent).toBe("Hi");
    expect(document.querySelector("strong")?.textContent).toBe("text");
    expect(document.querySelector("a")?.getAttribute("href")).toBe(
      "https://example.com/",
    );
  });

  it("renders no markup from the text", () => {
    const { document } = renderSSR(Markdown, {
      source: '<img src=x onerror="x"> [a](javascript:alert(1))',
    });

    expect(document.querySelector("img, script, a")).toBeNull();
  });
});
