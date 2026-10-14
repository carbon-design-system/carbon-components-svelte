import { render, screen } from "@testing-library/svelte";
import Toggle from "carbon-components-svelte/Toggle/Toggle.svelte";
import { carriersOf, externalLabel } from "../utils/aria-forwarding";

describe("Toggle aria forwarding", () => {
  it("joins a consumer aria-describedby on the switch after the built-in ids", () => {
    const { container } = render(Toggle, {
      props: {
        labelText: "Notifications",
        readonly: true,
        "aria-describedby": "extra-help",
      },
    });

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
    expect(toggle).toHaveAccessibleDescription("Read-only");
    expect(carriersOf(container, "aria-describedby", "extra-help")).toEqual([
      toggle,
    ]);
  });

  it("names the switch with a consumer aria-labelledby", () => {
    externalLabel("ext-label", "Email notifications");
    const { container } = render(Toggle, {
      props: { labelText: "Notifications", "aria-labelledby": "ext-label" },
    });

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAccessibleName("Email notifications");
    expect(carriersOf(container, "aria-labelledby", "ext-label")).toEqual([
      toggle,
    ]);
  });

  it("names the switch with a consumer aria-label, not the wrapper", () => {
    const { container } = render(Toggle, {
      props: { "aria-label": "Notifications" },
    });

    expect(screen.getByRole("switch")).toHaveAccessibleName("Notifications");
    expect(container.querySelector(".bx--form-item")).not.toHaveAttribute(
      "aria-label",
    );
  });
});
