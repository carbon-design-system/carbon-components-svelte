import { render, screen } from "@testing-library/svelte";
import SlotAliases from "./SlotAliases.test.svelte";

describe("Svelte 5 snippets for renamed slots", () => {
  it("renders the Toggletip labelChildren snippet as the label", () => {
    render(SlotAliases);

    expect(
      screen.getByTestId("toggletip-label-children").parentElement,
    ).toHaveClass("bx--toggletip-label");
  });
});
