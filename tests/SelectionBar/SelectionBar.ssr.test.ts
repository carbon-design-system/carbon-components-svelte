// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import SelectionBar from "./SelectionBar.test.svelte";

describe("SelectionBar on the server", () => {
  it("renders the bar, named by its count, with its items", () => {
    const { document } = renderSSR(SelectionBar, {
      count: 2,
      placement: "viewport-end",
    });
    const bar = document.querySelector("[role=region]");
    expect(bar?.className).toBe(
      "bx--selection-bar bx--selection-bar--viewport-end",
    );
    const name = document.getElementById(
      bar?.getAttribute("aria-labelledby") ?? "",
    );
    expect(name?.textContent?.trim()).toBe("2 selected");
    expect(
      bar?.querySelector(".bx--selection-bar__items")?.textContent,
    ).toMatch(/Billing/);
  });

  it("renders nothing at zero", () => {
    const { document } = renderSSR(SelectionBar, { count: 0 });
    expect(document.querySelector(".bx--selection-bar")).toBeNull();
  });
});
