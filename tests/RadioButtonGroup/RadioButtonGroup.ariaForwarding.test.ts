import { render, screen } from "@testing-library/svelte";
import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
import { carriersOf, externalLabel } from "../utils/aria-forwarding";

describe("RadioButtonGroup aria forwarding", () => {
  it("joins a consumer aria-describedby on the radiogroup after the built-in ids", () => {
    const { container } = render(RadioButtonGroup, {
      props: {
        legendText: "Shipping",
        readonly: true,
        "aria-describedby": "extra-help",
      },
    });

    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
    expect(group).toHaveAccessibleDescription("Read-only");
    expect(carriersOf(container, "aria-describedby", "extra-help")).toEqual([
      group,
    ]);
  });

  it("names the radiogroup with a consumer aria-labelledby", () => {
    externalLabel("ext-label", "Shipping speed");
    const { container } = render(RadioButtonGroup, {
      props: { legendText: "Shipping", "aria-labelledby": "ext-label" },
    });

    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAccessibleName("Shipping speed");
    expect(carriersOf(container, "aria-labelledby", "ext-label")).toEqual([
      group,
    ]);
  });

  it("names the radiogroup with a consumer aria-label", () => {
    const { container } = render(RadioButtonGroup, {
      props: { "aria-label": "Shipping" },
    });

    expect(screen.getByRole("radiogroup")).toHaveAccessibleName("Shipping");
    expect(container.querySelectorAll("[aria-label]")).toHaveLength(1);
  });
});
