// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import History from "./History.test.svelte";

describe("History server render", () => {
  it("renders from the stores without touching the DOM", () => {
    const { document } = renderSSR(History);
    expect(
      document.querySelector('[data-testid="undo"]')?.hasAttribute("disabled"),
    ).toBe(true);
    expect(document.querySelector('[data-testid="count"]')?.textContent).toBe(
      "0",
    );
  });
});
