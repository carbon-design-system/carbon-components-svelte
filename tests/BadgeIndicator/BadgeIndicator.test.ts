import { render } from "@testing-library/svelte";
import BadgeIndicator from "carbon-components-svelte/BadgeIndicator/BadgeIndicator.svelte";

const renderBadge = (props: Record<string, unknown> = {}) => {
  const { container } = render(BadgeIndicator, { props });
  return container.querySelector(".bx--badge-indicator");
};

describe("BadgeIndicator", () => {
  it.each([
    [undefined, ""],
    [0, ""],
    [-1, ""],
    [4, "4"],
    [999, "999"],
    [1000, "999+"],
    ["1.2k", "1.2k"],
  ])("renders count=%j as %j", (count, text) => {
    const badge = renderBadge({ count });

    expect(badge?.textContent?.trim()).toBe(text);
    expect(badge?.classList.contains("bx--badge-indicator--count")).toBe(
      text !== "",
    );
  });

  it("forwards rest props to the underlying element", () => {
    const badge = renderBadge({ id: "notifications", class: "custom" });

    expect(badge).toHaveAttribute("id", "notifications");
    expect(badge).toHaveClass("bx--badge-indicator", "custom");
  });
});
