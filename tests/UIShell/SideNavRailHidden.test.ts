import { render, screen } from "@testing-library/svelte";
import SideNavRailHidden from "./SideNavRailHidden.test.svelte";

describe("SideNav closed rail", () => {
  it("stays in the accessibility tree while it is visible", () => {
    render(SideNavRailHidden);

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav).not.toHaveAttribute("aria-hidden", "true");
    expect(nav).not.toHaveStyle({ visibility: "hidden" });
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  it("hides a closed non-rail side nav", () => {
    render(SideNavRailHidden, { props: { rail: false } });

    expect(
      screen.queryByRole("navigation", { name: "Main" }),
    ).not.toBeInTheDocument();
  });
});
