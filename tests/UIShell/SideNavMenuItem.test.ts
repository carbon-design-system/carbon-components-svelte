import { render, screen } from "@testing-library/svelte";
import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";

describe("SideNavMenuItem", () => {
  it("applies the current-page styling class when isSelected", () => {
    render(SideNavMenuItem, {
      props: { href: "/", text: "Overview", isSelected: true },
    });

    const link = screen.getByRole("link", { name: "Overview" });
    expect(link).toHaveClass("bx--side-nav__link--current");
    expect(link).toHaveAttribute("aria-current", "page");
  });
});
