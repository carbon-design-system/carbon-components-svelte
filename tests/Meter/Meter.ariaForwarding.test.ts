import { render, screen } from "@testing-library/svelte";
import Meter from "carbon-components-svelte/Meter/Meter.svelte";

describe("Meter aria forwarding", () => {
  beforeEach(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<span id="extra-help">Extra help</span><span id="ext-label">External label</span>',
    );
  });

  afterEach(() => {
    document.getElementById("extra-help")?.remove();
    document.getElementById("ext-label")?.remove();
  });

  it("joins a consumer aria-describedby after the helper text on the meter", () => {
    const { container } = render(Meter, {
      props: {
        labelText: "Storage",
        helperText: "Helper",
        value: 40,
        "aria-describedby": "extra-help",
      },
    });

    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
    expect(meter).toHaveAccessibleDescription("Helper Extra help");
    expect(container.querySelector(".bx--meter")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("names the meter from a consumer aria-labelledby", () => {
    const { container } = render(Meter, {
      props: { labelText: "Storage", "aria-labelledby": "ext-label" },
    });

    expect(screen.getByRole("meter")).toHaveAccessibleName("External label");
    expect(container.querySelector(".bx--meter")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("names the meter from a consumer aria-label", () => {
    const { container } = render(Meter, {
      props: { labelText: "Storage", "aria-label": "Custom" },
    });

    const meter = screen.getByRole("meter");
    expect(meter).toHaveAccessibleName("Custom");
    expect(meter).not.toHaveAttribute("aria-labelledby");
    expect(container.querySelector(".bx--meter")).not.toHaveAttribute(
      "aria-label",
    );
  });
});
