import { render, screen } from "@testing-library/svelte";
import InterstitialScreenAria from "./InterstitialScreen.ariaForwarding.test.svelte";

describe("InterstitialScreen aria forwarding (modal mode)", () => {
  it("places a consumer aria-describedby on the dialog", () => {
    const { container } = render(InterstitialScreenAria, {
      props: { "aria-describedby": "extra-help" },
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-describedby", "extra-help");
    expect(dialog).toHaveAccessibleDescription("Extra help");
    expect(
      container.querySelector(".bx--modal[role='presentation']"),
    ).not.toHaveAttribute("aria-describedby");
  });

  it("names the dialog from a consumer aria-labelledby", () => {
    const { container } = render(InterstitialScreenAria, {
      props: { "aria-labelledby": "ext-label" },
    });

    expect(screen.getByRole("dialog")).toHaveAccessibleName("External label");
    expect(
      container.querySelector(".bx--modal[role='presentation']"),
    ).not.toHaveAttribute("aria-labelledby");
  });
});
