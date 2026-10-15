import { render, screen } from "@testing-library/svelte";
import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
import { externalLabel } from "../utils/aria-forwarding";

describe("RangeSlider aria forwarding", () => {
  it("uses a consumer aria-labelledby as the group label of each control", () => {
    externalLabel("ext-label", "Price range");
    const { container } = render(RangeSlider, {
      props: { labelText: "Price", "aria-labelledby": "ext-label" },
    });

    const [lowerThumb, upperThumb] = screen.getAllByRole("slider");
    const [lowerInput, upperInput] = screen.getAllByRole("spinbutton");
    expect(lowerThumb).toHaveAccessibleName("Price range Lower bound");
    expect(upperThumb).toHaveAccessibleName("Price range Upper bound");
    expect(lowerInput).toHaveAccessibleName("Price range Lower bound");
    expect(upperInput).toHaveAccessibleName("Price range Upper bound");
    expect(container.querySelector(".bx--form-item")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("uses a consumer aria-label as the group label of each control", () => {
    const { container } = render(RangeSlider, {
      props: {
        labelText: "Price",
        ariaLabelInput: "Min",
        ariaLabelInputUpper: "Max",
        "aria-label": "Price range",
      },
    });

    const [lowerThumb, upperThumb] = screen.getAllByRole("slider");
    const [lowerInput, upperInput] = screen.getAllByRole("spinbutton");
    expect(lowerThumb).toHaveAccessibleName("Price range Min");
    expect(upperThumb).toHaveAccessibleName("Price range Max");
    expect(lowerInput).toHaveAccessibleName("Price range Min");
    expect(upperInput).toHaveAccessibleName("Price range Max");
    expect(container.querySelector(".bx--form-item")).not.toHaveAttribute(
      "aria-label",
    );
  });
});
