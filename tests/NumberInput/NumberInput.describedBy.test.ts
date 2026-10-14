import { render, screen } from "@testing-library/svelte";
import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";

describe("NumberInput aria-describedby", () => {
  it("joins a consumer aria-describedby with the built-in description", () => {
    render(NumberInput, {
      props: {
        labelText: "Count",
        helperText: "1 to 10",
        "aria-describedby": "extra-help",
      },
    });

    const field = screen.getByRole("spinbutton");
    expect(field).toHaveAccessibleDescription("1 to 10");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });

  it("joins it in text mode too", () => {
    render(NumberInput, {
      props: {
        labelText: "Price",
        helperText: "In dollars",
        allowDecimal: true,
        "aria-describedby": "extra-help",
      },
    });

    const field = screen.getByRole("textbox");
    expect(field).toHaveAccessibleDescription("In dollars");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });
});
