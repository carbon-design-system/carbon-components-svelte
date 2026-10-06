// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import ComposedModalSsr from "./ComposedModalSsr.test.svelte";

function accessibleName(document: Document) {
  const dialog = document.querySelector('[role="dialog"]');
  const ariaLabel = dialog?.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;
  const ids = dialog?.getAttribute("aria-labelledby")?.split(" ") ?? [];
  return ids
    .map((id) => document.getElementById(id)?.textContent?.trim())
    .filter(Boolean)
    .join(" ");
}

describe("ComposedModal server render", () => {
  it("names the dialog from the header without waiting for hydration", () => {
    const { document } = renderSSR(ComposedModalSsr);

    expect(accessibleName(document)).toContain("Title");
  });

  it("keeps a consumer aria-label", () => {
    const { document } = renderSSR(ComposedModalSsr, {
      ariaLabel: "Delete file",
    });
    const dialog = document.querySelector('[role="dialog"]');

    expect(dialog).toHaveAttribute("aria-label", "Delete file");
    expect(dialog).not.toHaveAttribute("aria-labelledby");
  });

  it("keeps a consumer aria-labelledby on the dialog", () => {
    const { document } = renderSSR(ComposedModalSsr, {
      ariaLabelledby: "custom-heading",
    });

    expect(document.querySelector('[role="dialog"]')).toHaveAttribute(
      "aria-labelledby",
      "custom-heading",
    );
    expect(document.querySelector(".bx--modal")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });
});
