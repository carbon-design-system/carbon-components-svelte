import { render, screen } from "@testing-library/svelte";
import IconContext from "./IconContext.test.svelte";

describe("setIconContext", () => {
  it("draws a swapped icon with the built-in icon's props and classes", () => {
    const { container: swapped } = render(IconContext);
    const { container: builtIn } = render(IconContext, { swap: false });

    for (const selector of [
      ".bx--accordion__arrow",
      ".bx--search-magnifier-icon",
    ]) {
      const icon = swapped.querySelector(selector);
      const original = builtIn.querySelector(selector);
      assert(icon && original, selector);
      expect(icon).toHaveAttribute("data-swapped");
      expect(original).not.toHaveAttribute("data-swapped");
      expect(icon.getAttribute("class")).toContain(
        original.getAttribute("class"),
      );
    }
  });

  it("keeps the built-in icon for a name that isn't set", () => {
    const { container } = render(IconContext);
    const outer = screen.getAllByRole("textbox", { name: "Port" })[0];
    const field = outer.closest(".bx--text-input-wrapper");
    assert(field);
    expect(
      field.querySelector(".bx--text-input__invalid-icon"),
    ).not.toHaveAttribute("data-swapped");
    expect(container.querySelector("[data-swapped]")).not.toBeNull();
  });

  it("adds a nested call's icons to the ones set above it", () => {
    render(IconContext);
    const nested = screen.getByTestId("nested");

    expect(nested.querySelector(".bx--accordion__arrow")).toHaveAttribute(
      "data-swapped",
    );
    expect(
      nested.querySelector(".bx--text-input__invalid-icon"),
    ).toHaveAttribute("data-swapped");
  });
});
