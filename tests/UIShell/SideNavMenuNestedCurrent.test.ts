import { render, screen } from "@testing-library/svelte";
import SideNavMenuNestedCurrent from "./SideNavMenuNestedCurrent.test.svelte";

describe("SideNavMenu nested current page", () => {
  it.each([
    ["Level 1", "true"],
    ["Level 2", "true"],
    ["Level 3", "true"],
    ["Sibling", "false"],
  ])("sets %s's aria-expanded to %s on mount", (text, expanded) => {
    render(SideNavMenuNestedCurrent);

    expect(screen.getByRole("button", { name: text })).toHaveAttribute(
      "aria-expanded",
      expanded,
    );
  });
});
