import { render, screen } from "@testing-library/svelte";
import HeaderGlobalActionBadge from "./HeaderGlobalAction.badge.test.svelte";

describe("HeaderGlobalAction", () => {
  it("renders a dot badge when count is 0, and no badge when omitted", () => {
    render(HeaderGlobalActionBadge);
    const none = screen.getByTestId("no-badge");
    expect(
      none.querySelector(".bx--btn__badge-wrapper"),
    ).not.toBeInTheDocument();
    expect(none.querySelector(".bx--badge-indicator")).not.toBeInTheDocument();

    const container = screen.getByTestId("dot");
    const badge = container.querySelector(".bx--badge-indicator");
    const button = container.querySelector("button");

    expect(
      container.querySelector(".bx--btn__badge-wrapper"),
    ).toBeInTheDocument();
    expect(button).toHaveClass("bx--btn--lg");
    expect(badge).not.toHaveClass("bx--badge-indicator--count");
    expect(badge?.textContent?.trim()).toBe("");
  });
});
