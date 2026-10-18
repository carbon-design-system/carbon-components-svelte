import { render } from "@testing-library/svelte";
import SideNav from "../../src/UIShell/SideNav.svelte";

describe("SideNav border prop", () => {
  it("applies the border class when border is true", () => {
    const { container } = render(SideNav, { props: { border: true } });
    expect(container.querySelector(".bx--side-nav")).toHaveClass(
      "bx--side-nav--border",
    );
  });
});
