import { render, screen } from "@testing-library/svelte";
import SlotAliases from "./SlotAliases.test.svelte";

describe("Svelte 5 snippets for renamed slots", () => {
  it("renders the Toggletip labelChildren snippet as the label", () => {
    render(SlotAliases);

    expect(
      screen.getByTestId("toggletip-label-children").parentElement,
    ).toHaveClass("bx--toggletip-label");
  });

  it("renders the HeaderNavMenu textChildren snippet in the trigger", () => {
    render(SlotAliases);

    const trigger = screen.getByRole("menuitem", { name: "Products" });
    expect(trigger).toContainElement(
      screen.getByTestId("header-nav-menu-text-children"),
    );
    expect(trigger).not.toHaveTextContent("Ignored");
  });
});
