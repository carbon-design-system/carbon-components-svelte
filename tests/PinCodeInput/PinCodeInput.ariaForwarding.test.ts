import { render, screen } from "@testing-library/svelte";
import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";
import { carriersOf, externalLabel } from "../utils/aria-forwarding";

describe("PinCodeInput aria forwarding", () => {
  it("joins a consumer aria-describedby on the fieldset after the built-in ids", () => {
    const { container } = render(PinCodeInput, {
      props: {
        labelText: "Verification code",
        helperText: "Sent by text message",
        "aria-describedby": "extra-help",
      },
    });

    const group = screen.getByRole("group");
    expect(group).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
    expect(group).toHaveAccessibleDescription("Sent by text message");
    expect(carriersOf(container, "aria-describedby", "extra-help")).toEqual([
      group,
    ]);
  });

  it("names the fieldset with a consumer aria-labelledby", () => {
    externalLabel("ext-label", "One-time code");
    const { container } = render(PinCodeInput, {
      props: { labelText: "Code", "aria-labelledby": "ext-label" },
    });

    const group = screen.getByRole("group");
    expect(group).toHaveAccessibleName("One-time code");
    expect(carriersOf(container, "aria-labelledby", "ext-label")).toEqual([
      group,
    ]);
  });

  it("names the fieldset with a consumer aria-label", () => {
    const { container } = render(PinCodeInput, {
      props: { "aria-label": "One-time code" },
    });

    expect(screen.getByRole("group")).toHaveAccessibleName("One-time code");
    expect(container.querySelector(".bx--form-item")).not.toHaveAttribute(
      "aria-label",
    );
  });
});
