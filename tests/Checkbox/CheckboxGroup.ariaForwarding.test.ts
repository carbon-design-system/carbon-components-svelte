import { render, screen } from "@testing-library/svelte";
import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";
import { carriersOf, externalLabel } from "../utils/aria-forwarding";

describe("CheckboxGroup aria forwarding", () => {
  it("joins a consumer aria-describedby on the fieldset after the built-in ids", () => {
    const { container } = render(CheckboxGroup, {
      props: {
        legendText: "Toppings",
        helperText: "Pick any",
        "aria-describedby": "extra-help",
      },
    });

    const group = screen.getByRole("group");
    expect(group).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
    expect(group).toHaveAccessibleDescription("Pick any");
    expect(carriersOf(container, "aria-describedby", "extra-help")).toEqual([
      group,
    ]);
  });

  it("names the fieldset with a consumer aria-labelledby", () => {
    externalLabel("ext-label", "Pizza toppings");
    const { container } = render(CheckboxGroup, {
      props: { legendText: "Toppings", "aria-labelledby": "ext-label" },
    });

    const group = screen.getByRole("group");
    expect(group).toHaveAccessibleName("Pizza toppings");
    expect(carriersOf(container, "aria-labelledby", "ext-label")).toEqual([
      group,
    ]);
  });

  it("names the fieldset with a consumer aria-label", () => {
    const { container } = render(CheckboxGroup, {
      props: { "aria-label": "Toppings" },
    });

    expect(screen.getByRole("group")).toHaveAccessibleName("Toppings");
    expect(container.querySelectorAll("[aria-label]")).toHaveLength(1);
  });
});
