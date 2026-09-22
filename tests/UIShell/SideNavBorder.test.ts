import { render } from "@testing-library/svelte";
import SideNavBorder from "./SideNavBorder.test.svelte";

describe("SideNav border prop", () => {
  it("omits the border class by default", () => {
    const { container } = render(SideNavBorder);
    expect(container.querySelector(".bx--side-nav")).not.toHaveClass(
      "bx--side-nav--border",
    );
  });

  it("applies the border class when border is true", () => {
    const { container } = render(SideNavBorder, { props: { border: true } });
    expect(container.querySelector(".bx--side-nav")).toHaveClass(
      "bx--side-nav--border",
    );
  });

  it("applies the border class alongside the classic theme", () => {
    const { container } = render(SideNavBorder, {
      props: { border: true, theme: "classic" },
    });
    const nav = container.querySelector(".bx--side-nav");
    expect(nav).toHaveClass("bx--side-nav--border");
    expect(nav).toHaveClass("bx--side-nav--ui-shell-classic");
  });
});
