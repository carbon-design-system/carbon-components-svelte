// @vitest-environment node
import Loading from "carbon-components-svelte/Loading/Loading.svelte";
import { renderSSR } from "../utils/ssr";

describe("Loading server render", () => {
  it("renders a waiting spinner when active with a delay", () => {
    const { document } = renderSSR(Loading, {
      withOverlay: false,
      delay: 300,
    });
    const spinner = document.querySelector(".bx--loading");

    expect(spinner).toHaveClass("bx--loading--delayed");
    expect(spinner).not.toHaveClass("bx--loading--stop");
    expect(spinner?.querySelector("svg")).toHaveStyle({
      animationDuration: "300ms",
    });
  });

  it("renders a waiting overlay when active with a delay", () => {
    const { document } = renderSSR(Loading, { delay: 300 });
    const overlay = document.querySelector(".bx--loading-overlay");

    expect(overlay).toHaveClass("bx--loading-overlay--delayed");
    expect(overlay).toHaveAttribute("role", "dialog");
    expect(overlay).toHaveStyle({ animationDuration: "300ms" });
  });

  it("renders the spinner shown with no delay", () => {
    const { document } = renderSSR(Loading, { withOverlay: false });
    const spinner = document.querySelector(".bx--loading");

    expect(spinner).toHaveClass("bx--loading");
    expect(spinner).not.toHaveClass("bx--loading--delayed");
    expect(spinner?.querySelector("svg")).not.toHaveAttribute("style");
  });

  it("renders nothing when inactive with a delay", () => {
    const { html } = renderSSR(Loading, { active: false, delay: 300 });

    expect(html).not.toContain("bx--loading");
    expect(renderSSR(Loading, { active: false }).html).toContain(
      "bx--loading-overlay--stop",
    );
  });
});
