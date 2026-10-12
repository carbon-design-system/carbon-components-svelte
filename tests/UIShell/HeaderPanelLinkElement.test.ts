import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import HeaderPanelLinkElement from "./HeaderPanelLinkElement.test.svelte";

describe("HeaderPanelLink element", () => {
  it("applies anchor-only and button-only attributes to the right element", async () => {
    const { component } = render(HeaderPanelLinkElement);

    const link = screen.getByRole("link", { name: "Alpha" });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).not.toHaveAttribute("type");
    expect(link).toHaveAttribute("aria-current", "page");
    expect(component.ref).toBe(link);

    component.href = undefined;
    await tick();

    const button = screen.getByRole("button", { name: "Alpha" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).not.toHaveAttribute("rel");
    expect(button).not.toHaveAttribute("href");
    expect(button).toHaveAttribute("aria-current", "page");
    expect(button).toHaveClass("bx--switcher__item-link--selected");
    expect(component.ref).toBe(button);
  });

  it("forwards click from both elements", async () => {
    const { component } = render(HeaderPanelLinkElement);

    await user.click(screen.getByRole("link", { name: "Alpha" }));
    expect(component.clicks).toBe(1);

    component.href = undefined;
    await tick();
    await user.click(screen.getByRole("button", { name: "Alpha" }));
    expect(component.clicks).toBe(2);
  });
});
