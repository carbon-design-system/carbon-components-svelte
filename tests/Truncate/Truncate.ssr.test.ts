// @vitest-environment node
import Truncate from "carbon-components-svelte/Truncate/Truncate.svelte";
import { renderSSR } from "../utils/ssr";

describe("Truncate server render", () => {
  // The server can't measure, so it renders the text as clipped only. The
  // client adds the tab stop or the toggle once it sees the text overflow.
  it.each(["none", "tooltip", "expand"] as const)(
    "renders plain clipped text for reveal %s",
    (reveal) => {
      const { document } = renderSSR(Truncate, { reveal });
      const text = document.querySelector("p");

      expect(text).toHaveClass("bx--text-truncate--end");
      expect(text).not.toHaveAttribute("tabindex");
      expect(document.querySelector("button")).toBeNull();
      expect(document.querySelector(".bx--tooltip-portal")).toBeNull();
    },
  );

  it("starts expanded text without the clamp and with the toggle", () => {
    const { document } = renderSSR(Truncate, {
      reveal: "expand",
      expanded: true,
    });
    const text = document.querySelector("p");
    const toggle = document.querySelector("button");

    expect(text).not.toHaveClass("bx--text-truncate--end");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-controls", text?.id);
    expect(toggle).toHaveTextContent("View less");
  });
});
