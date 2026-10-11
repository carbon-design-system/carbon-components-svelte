import { render, screen } from "@testing-library/svelte";
import axe from "axe-core";
import SideNavDivider from "./SideNavDivider.test.svelte";

describe("SideNavDivider", () => {
  it("renders the separator inside a plain list item", () => {
    render(SideNavDivider);
    const divider = screen.getByTestId("divider");
    expect(divider.tagName).toBe("LI");
    expect(divider).not.toHaveAttribute("role");
    expect(divider).toHaveClass("bx--side-nav__divider");
    expect(divider.querySelector("hr")).toBe(screen.getByRole("separator"));
  });

  it("keeps the side nav list valid for axe", async () => {
    const { container } = render(SideNavDivider);
    const results = await axe.run(container, {
      runOnly: ["list", "listitem"],
    });
    expect(results.violations).toEqual([]);
  });
});
