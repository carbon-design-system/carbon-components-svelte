// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Tearsheet from "./TearsheetSlots.test.svelte";

describe("Tearsheet (server)", () => {
  it("renders an open tearsheet in place, named and described, with the AI surface", () => {
    const { document } = renderSSR(Tearsheet);

    const root = document.querySelector(".bx--tearsheet");
    expect(root?.classList).toContain("is-visible");
    expect(root?.hasAttribute("inert")).toBe(false);
    expect(root?.classList).toContain("bx--tearsheet--ai-label");

    const dialog = document.querySelector("[role=dialog]");
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.getAttribute("aria-labelledby")).toBe(
      document.querySelector("h2")?.id,
    );
    expect(dialog?.getAttribute("aria-describedby")).toBe(
      document.querySelector(".bx--tearsheet__description")?.id,
    );
    expect(
      document.querySelector(".bx--action-set .bx--btn--primary"),
    ).not.toBeNull();
  });

  it("renders a closed tearsheet inert, without its body", () => {
    const { document } = renderSSR(Tearsheet, { open: false });

    const root = document.querySelector(".bx--tearsheet");
    expect(root?.hasAttribute("inert")).toBe(true);
    expect(root?.classList).not.toContain("is-visible");
    expect(root?.textContent).not.toContain("Body");
  });
});
