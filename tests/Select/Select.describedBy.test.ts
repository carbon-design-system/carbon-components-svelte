import { render, screen } from "@testing-library/svelte";
import Select from "carbon-components-svelte/Select/Select.svelte";

describe("Select aria-describedby", () => {
  it("joins a consumer aria-describedby with the built-in description", () => {
    render(Select, {
      props: {
        labelText: "Region",
        helperText: "Pick one",
        "aria-describedby": "extra-help",
      },
    });

    const field = screen.getByRole("combobox");
    expect(field).toHaveAccessibleDescription("Pick one");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });

  it("joins it in the inline variant too", () => {
    render(Select, {
      props: {
        inline: true,
        labelText: "Region",
        helperText: "Pick one",
        "aria-describedby": "extra-help",
      },
    });

    const field = screen.getByRole("combobox");
    expect(field).toHaveAccessibleDescription("Pick one");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });
});
