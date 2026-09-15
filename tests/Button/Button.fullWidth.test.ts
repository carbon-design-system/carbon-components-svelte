import { render, screen } from "@testing-library/svelte";
import ButtonFullWidth from "./Button.fullWidth.test.svelte";

describe("Button fullWidth", () => {
  it("should apply the full width class to a button", () => {
    render(ButtonFullWidth);

    expect(
      screen.getByRole("button", { name: "Full width button" }),
    ).toHaveClass("bx--btn--full-width");
  });

  it("should apply the full width class to a link", () => {
    render(ButtonFullWidth);

    expect(screen.getByRole("link", { name: "Full width link" })).toHaveClass(
      "bx--btn--full-width",
    );
  });
});
