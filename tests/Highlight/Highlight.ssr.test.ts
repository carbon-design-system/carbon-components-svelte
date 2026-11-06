// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import HighlightHost from "./Highlight.test.svelte";

describe("Highlight server render", () => {
  it("writes the marks and the whole text", () => {
    const { document } = renderSSR(HighlightHost);

    expect(document.querySelector("mark")?.textContent).toBe("Café");
    expect(document.querySelector("[data-testid=host]")?.textContent).toBe(
      "Café au lait",
    );
  });
});
