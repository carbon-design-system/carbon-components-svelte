// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import WebTerminal from "./WebTerminal.ssr.test.svelte";

describe("WebTerminal on the server", () => {
  it("renders the dark zone, a named log and a labelled command line", () => {
    const { document } = renderSSR(WebTerminal);

    const root = document.querySelector(".bx--web-terminal");
    expect(root?.classList.contains("bx--g100")).toBe(true);
    expect(root?.getAttribute("role")).toBe("group");
    expect(root?.getAttribute("style")).toContain("height: 24rem");

    const log = document.querySelector("[role=log]");
    expect(log?.getAttribute("aria-label")).toBe("Shell output");
    expect(log?.getAttribute("aria-live")).toBe("off");
    expect(document.querySelector("input")?.getAttribute("aria-label")).toBe(
      "Command",
    );
    expect(document.querySelectorAll("[data-line-id]")).toHaveLength(0);
  });

  it("picks the palette from the theme without the browser", () => {
    const light = renderSSR(WebTerminal, { theme: "white" }).document;
    expect(
      light
        .querySelector(".bx--web-terminal")
        ?.classList.contains("bx--web-terminal--light"),
    ).toBe(true);

    // Reading the operating system needs a browser, so the dark set stands in.
    const system = renderSSR(WebTerminal, { theme: "system" }).document;
    const root = system.querySelector(".bx--web-terminal");
    expect(root?.classList.contains("bx--system")).toBe(true);
    expect(root?.classList.contains("bx--web-terminal--light")).toBe(false);
  });
});
