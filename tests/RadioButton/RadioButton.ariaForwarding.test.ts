import { render, screen } from "@testing-library/svelte";
import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
import { carriersOf, externalLabel } from "../utils/aria-forwarding";

describe("RadioButton aria forwarding", () => {
  it("joins a consumer aria-describedby on the input after the built-in ids", () => {
    const { container } = render(RadioButton, {
      props: {
        labelText: "Standard",
        readonly: true,
        "aria-describedby": "extra-help",
      },
    });

    const input = screen.getByRole("radio");
    expect(input).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
    expect(input).toHaveAccessibleDescription("Read-only");
    expect(carriersOf(container, "aria-describedby", "extra-help")).toEqual([
      input,
    ]);
  });

  it("names the input with a consumer aria-labelledby", () => {
    externalLabel("ext-label", "Standard shipping");
    const { container } = render(RadioButton, {
      props: { labelText: "Standard", "aria-labelledby": "ext-label" },
    });

    const input = screen.getByRole("radio");
    expect(input).toHaveAccessibleName("Standard shipping");
    expect(carriersOf(container, "aria-labelledby", "ext-label")).toEqual([
      input,
    ]);
  });
});
