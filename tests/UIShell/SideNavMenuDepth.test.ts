import { render, screen } from "@testing-library/svelte";
import { expectInlineStyle } from "../utils/inline-style";
import SideNavMenuDepth from "./SideNavMenuDepth.test.svelte";

describe("SideNavMenu nesting depth", () => {
  it.each([
    ["Level 1", "", ""],
    ["Level 2", "2", "1"],
    ["Level 3", "3", "2"],
  ])(
    "sets %s's menu depth to '%s' and icon depth to '%s'",
    (text, depth, iconDepth) => {
      render(SideNavMenuDepth);

      const menu = screen.getByRole("button", {
        name: text,
      }).nextElementSibling;
      expectInlineStyle(menu, {
        "--ccs-side-nav-menu-depth": depth,
        "--ccs-side-nav-menu-icon-depth": iconDepth,
      });
    },
  );
});
