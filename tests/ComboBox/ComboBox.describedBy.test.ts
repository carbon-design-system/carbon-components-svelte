import { render, screen } from "@testing-library/svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";

describe("ComboBox aria-describedby", () => {
  it("joins a consumer aria-describedby with the built-in description", () => {
    render(ComboBox, {
      props: {
        labelText: "Fruit",
        helperText: "Pick a fruit",
        items: [],
        "aria-describedby": "extra-help",
      },
    });

    const field = screen.getByRole("combobox");
    expect(field).toHaveAccessibleDescription("Pick a fruit");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });
});
