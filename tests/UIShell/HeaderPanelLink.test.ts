import { render, screen } from "@testing-library/svelte";
import HeaderPanelLink from "./HeaderPanelLink.test.svelte";

describe("HeaderPanelLink", () => {
  it("renders an anchor with an href and a button without one", () => {
    render(HeaderPanelLink);

    const link = screen.getByRole("link", { name: "Docs" });
    expect(link).toHaveAttribute("href", "#docs");
    expect(link).toHaveClass("bx--switcher__item-link");

    const button = screen.getByRole("button", { name: "Switch theme" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("bx--switcher__item-link");
  });

  it("marks only the selected link as current", () => {
    render(HeaderPanelLink);

    const current = screen.getByRole("button", { name: "Current" });
    expect(current).toHaveClass("bx--switcher__item-link--selected");
    expect(current).toHaveAttribute("aria-current", "page");

    expect(screen.getByRole("link", { name: "Docs" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(
      screen.getByRole("button", { name: "Switch theme" }),
    ).not.toHaveAttribute("aria-current");
  });
});
