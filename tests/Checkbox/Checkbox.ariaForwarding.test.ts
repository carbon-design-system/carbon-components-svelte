import { render, screen } from "@testing-library/svelte";
import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
import { carriersOf, externalLabel } from "../utils/aria-forwarding";

describe("Checkbox aria forwarding", () => {
  it("joins a consumer aria-describedby on the input after the built-in ids", () => {
    const { container } = render(Checkbox, {
      props: {
        labelText: "Accept terms",
        helperText: "Required to continue",
        "aria-describedby": "extra-help",
      },
    });

    const input = screen.getByRole("checkbox");
    expect(input).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
    expect(input).toHaveAccessibleDescription("Required to continue");
    expect(carriersOf(container, "aria-describedby", "extra-help")).toEqual([
      input,
    ]);
  });

  it("names the input with a consumer aria-labelledby", () => {
    externalLabel("ext-label", "Terms of service");
    const { container } = render(Checkbox, {
      props: { labelText: "Accept", "aria-labelledby": "ext-label" },
    });

    const input = screen.getByRole("checkbox");
    expect(input).toHaveAccessibleName("Terms of service");
    expect(carriersOf(container, "aria-labelledby", "ext-label")).toEqual([
      input,
    ]);
  });

  it("names the input with a consumer aria-label", () => {
    const { container } = render(Checkbox, {
      props: { "aria-label": "Accept terms" },
    });

    const input = screen.getByRole("checkbox");
    expect(input).toHaveAccessibleName("Accept terms");
    expect(container.querySelectorAll("[aria-label]")).toHaveLength(1);
  });
});
