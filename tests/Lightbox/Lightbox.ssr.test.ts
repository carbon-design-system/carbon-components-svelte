// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Lightbox from "./Lightbox.test.svelte";

describe("Lightbox server render", () => {
  it("renders a closed dialog with no content until it first opens", () => {
    const { document } = renderSSR(Lightbox, { open: false });

    expect(document.querySelector(".bx--modal")).not.toHaveClass("is-visible");
    expect(document.querySelector(".bx--image-viewer")).toBeNull();
    expect(document.querySelector('[role="listbox"]')).toBeNull();
  });

  it("names the dialog and describes its role when open", () => {
    const { document } = renderSSR(Lightbox, { open: true });

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toHaveAttribute("aria-label", "Product photos");
    expect(dialog).toHaveAttribute("aria-roledescription", "image gallery");
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(4);
  });
});
