import { render, screen } from "@testing-library/svelte";
import Slider from "carbon-components-svelte/Slider/Slider.svelte";
import { carriersOf, externalLabel } from "../utils/aria-forwarding";

describe("Slider aria forwarding", () => {
  it("joins a consumer aria-describedby on the thumb and text input", () => {
    const { container } = render(Slider, {
      props: {
        labelText: "Volume",
        helperText: "0 to 100",
        "aria-describedby": "extra-help",
      },
    });

    const thumb = screen.getByRole("slider");
    const input = screen.getByRole("spinbutton");
    for (const control of [thumb, input]) {
      expect(control).toHaveAttribute(
        "aria-describedby",
        expect.stringMatching(/^\S+ extra-help$/),
      );
      expect(control).toHaveAccessibleDescription("0 to 100");
    }
    expect(carriersOf(container, "aria-describedby", "extra-help")).toEqual([
      thumb,
      input,
    ]);
  });

  it("names the thumb and text input with a consumer aria-labelledby", () => {
    externalLabel("ext-label", "Master volume");
    const { container } = render(Slider, {
      props: { labelText: "Volume", "aria-labelledby": "ext-label" },
    });

    const thumb = screen.getByRole("slider");
    const input = screen.getByRole("spinbutton");
    expect(thumb).toHaveAccessibleName("Master volume");
    expect(input).toHaveAccessibleName("Master volume");
    expect(carriersOf(container, "aria-labelledby", "ext-label")).toEqual([
      thumb,
      input,
    ]);
  });

  it("names the thumb and text input with a consumer aria-label", () => {
    const { container } = render(Slider, {
      props: { labelText: "Volume", "aria-label": "Master volume" },
    });

    expect(screen.getByRole("slider")).toHaveAccessibleName("Master volume");
    expect(screen.getByRole("spinbutton")).toHaveAccessibleName(
      "Master volume",
    );
    expect(container.querySelector(".bx--form-item")).not.toHaveAttribute(
      "aria-label",
    );
  });
});
