import { render, screen } from "@testing-library/svelte";
import ToggletipAria from "./Toggletip.ariaForwarding.test.svelte";

describe("Toggletip aria forwarding", () => {
  it("joins a consumer aria-describedby after the open content id", () => {
    render(ToggletipAria, {
      props: {
        open: true,
        toggletipProps: { "aria-describedby": "extra-help" },
      },
    });

    const button = screen.getByRole("button", { name: "Show information" });
    expect(button).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
    expect(button).toHaveAccessibleDescription("Tip content Extra help");
    expect(document.getElementById("tip")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("keeps a consumer aria-describedby while closed", () => {
    render(ToggletipAria, {
      props: { toggletipProps: { "aria-describedby": "extra-help" } },
    });

    const button = screen.getByRole("button", { name: "Show information" });
    expect(button).toHaveAttribute("aria-describedby", "extra-help");
    expect(button).toHaveAccessibleDescription("Extra help");
  });

  it("names the trigger with a consumer aria-labelledby", () => {
    render(ToggletipAria, {
      props: { toggletipProps: { "aria-labelledby": "external-name" } },
    });

    expect(
      screen.getByRole("button", { name: "External name" }),
    ).toBeInTheDocument();
    expect(document.getElementById("tip")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("lets a consumer aria-label win over iconDescription", () => {
    render(ToggletipAria, {
      props: { toggletipProps: { "aria-label": "Consumer label" } },
    });

    expect(
      screen.getByRole("button", { name: "Consumer label" }),
    ).toBeInTheDocument();
    expect(document.getElementById("tip")).not.toHaveAttribute("aria-label");
  });
});
