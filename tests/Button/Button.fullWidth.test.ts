import { render, screen } from "@testing-library/svelte";
import ButtonFullWidth from "./Button.fullWidth.test.svelte";

describe("Button fullWidth", () => {
  it.each([
    ["button", "Full width button"],
    ["link", "Full width link"],
  ])("should apply the full width class to a %s", (role, name) => {
    render(ButtonFullWidth);

    expect(screen.getByRole(role, { name })).toHaveClass("bx--btn--full-width");
  });
});
