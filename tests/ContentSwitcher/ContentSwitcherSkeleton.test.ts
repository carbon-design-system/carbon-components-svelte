import { render } from "@testing-library/svelte";
import ContentSwitcherSkeleton from "carbon-components-svelte/ContentSwitcher/ContentSwitcherSkeleton.svelte";

describe("ContentSwitcherSkeleton", () => {
  it("draws three switches by default", () => {
    const { container } = render(ContentSwitcherSkeleton);
    const switcher = container.querySelector(".bx--content-switcher");
    expect(switcher).toHaveClass("bx--skeleton");
    expect(
      switcher?.querySelectorAll(".bx--content-switcher__skeleton-switch"),
    ).toHaveLength(3);
  });

  it("takes the count, size and icon-only layout of its switcher", () => {
    const { container } = render(ContentSwitcherSkeleton, {
      props: { count: 2, size: "sm", iconOnly: true },
    });
    const switcher = container.querySelector(".bx--content-switcher");
    expect(switcher).toHaveClass(
      "bx--content-switcher--sm",
      "bx--content-switcher--icon-only",
    );
    expect(
      switcher?.querySelectorAll(".bx--content-switcher__skeleton-switch"),
    ).toHaveLength(2);
  });
});
