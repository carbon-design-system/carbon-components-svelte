// @vitest-environment node
import Flag from "carbon-components-svelte/Flag/Flag.svelte";
import { JP } from "carbon-components-svelte/flags/index.js";
import { renderSSR } from "../utils/ssr";

describe("Flag server render", () => {
  it("writes the flag's markup and size", () => {
    const { document } = renderSSR(Flag, { flag: JP, size: 16 });
    const svg = document.querySelector("svg");

    expect(svg?.getAttribute("width")).toBe("16");
    expect(svg?.getAttribute("height")).toBe("12");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.querySelectorAll("path")).toHaveLength(2);
  });

  it("writes the code box when there is no flag", () => {
    const { document } = renderSSR(Flag, { code: "XK" });

    expect(document.querySelector("svg")).toBeNull();
    expect(document.querySelector(".bx--flag--badge")?.textContent).toBe("XK");
  });
});
