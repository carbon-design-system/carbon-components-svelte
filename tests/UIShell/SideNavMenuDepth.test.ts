import { render, screen } from "@testing-library/svelte";
import { expectInlineStyle } from "../utils/inline-style";
import SideNavMenuDepth from "./SideNavMenuDepth.test.svelte";

describe("SideNavMenu nesting depth", () => {
  it.each([
    ["Level 1", "", "", true],
    ["Level 2", "2", "1", false],
    ["Level 3", "3", "2", true],
  ])(
    "sets %s's menu depth to '%s', icon depth to '%s' and icon item class to %s",
    (text, depth, iconDepth, hasIcon) => {
      render(SideNavMenuDepth);

      const button = screen.getByRole("button", { name: text });
      expectInlineStyle(button.nextElementSibling, {
        "--ccs-side-nav-menu-depth": depth,
        "--ccs-side-nav-menu-icon-depth": iconDepth,
      });
      expect(
        button.parentElement?.classList.contains("bx--side-nav__item--icon"),
      ).toBe(hasIcon);
    },
  );
});
