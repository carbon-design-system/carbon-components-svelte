import { render, screen } from "@testing-library/svelte";
import HeaderGlobalActionBadge from "./HeaderGlobalAction.badge.test.svelte";

describe("HeaderGlobalAction", () => {
  it("does not render a badge when count is omitted", () => {
    render(HeaderGlobalActionBadge);
    const container = screen.getByTestId("no-badge");

    expect(
      container.querySelector(".bx--btn__badge-wrapper"),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(".bx--badge-indicator"),
    ).not.toBeInTheDocument();
  });

  it("renders a dot badge when count is 0", () => {
    render(HeaderGlobalActionBadge);
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

  it("renders a numbered badge when count is positive", () => {
    render(HeaderGlobalActionBadge);
    const container = screen.getByTestId("count");
    const badge = container.querySelector(".bx--badge-indicator");

    expect(
      container.querySelector(".bx--btn__badge-wrapper"),
    ).toBeInTheDocument();
    expect(badge).toHaveClass("bx--badge-indicator--count");
    expect(badge).toHaveTextContent("4");
  });
});
