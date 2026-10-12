import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
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

  it("keeps the selected state on a button", () => {
    render(HeaderPanelLink);

    const current = screen.getByRole("button", { name: "Current" });
    expect(current).toHaveClass("bx--switcher__item-link--selected");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("is keyboard focusable and forwards click", async () => {
    render(HeaderPanelLink);

    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "Switch theme" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByTestId("clicks")).toHaveTextContent("1");
  });
});
