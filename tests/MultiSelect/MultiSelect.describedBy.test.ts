import { render, screen } from "@testing-library/svelte";
import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";

describe("MultiSelect aria-describedby", () => {
  it("joins a consumer aria-describedby with the built-in description", () => {
    render(MultiSelect, {
      props: {
        labelText: "Fruit",
        helperText: "Pick fruits",
        items: [],
        "aria-describedby": "extra-help",
      },
    });

    const field = screen.getByRole("combobox");
    expect(field).toHaveAccessibleDescription("Pick fruits");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });

  it("keeps a consumer aria-describedby without helper text", () => {
    render(MultiSelect, {
      props: {
        labelText: "Fruit",
        items: [],
        "aria-describedby": "extra-help",
      },
    });

    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-describedby",
      "extra-help",
    );
  });
});
