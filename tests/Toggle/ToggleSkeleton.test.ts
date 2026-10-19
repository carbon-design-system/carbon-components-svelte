import { render, screen } from "@testing-library/svelte";
import ToggleSkeletonSlot from "./ToggleSkeleton.slot.test.svelte";
import ToggleSkeletonNullishAriaLabel from "./ToggleSkeletonNullishAriaLabel.test.svelte";

describe("ToggleSkeleton", () => {
  it("supports custom label slot", () => {
    render(ToggleSkeletonSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  // Regression: ?? for aria-label so empty string is used (not fallback)
  it("uses empty aria-label when passed (nullish coalescing)", () => {
    render(ToggleSkeletonNullishAriaLabel, { props: { ariaLabel: "" } });
    const label = document.querySelector("label[aria-label]");
    expect(label).toHaveAttribute("aria-label", "");
  });
});
