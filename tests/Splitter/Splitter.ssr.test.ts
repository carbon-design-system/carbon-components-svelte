// @vitest-environment node
import Splitter from "carbon-components-svelte/Splitter/Splitter.svelte";
import { renderSSR } from "../utils/ssr";

describe("Splitter server render", () => {
  it("renders a pixel size as the start pane's basis, held by percentage bounds in CSS", () => {
    const { document } = renderSSR(Splitter, { size: "240px", max: 50 });
    const startPane = document.querySelector<HTMLElement>(
      ".bx--splitter__pane--start",
    );
    const separator = document.querySelector("[role='separator']");

    assert(startPane);
    expect(startPane.style.flexBasis).toBe("240px");
    expect(startPane.style.maxWidth).toBe("50%");
    // A percentage of an unmeasured splitter would be a guess.
    expect(separator?.hasAttribute("aria-valuenow")).toBe(false);
  });
});
