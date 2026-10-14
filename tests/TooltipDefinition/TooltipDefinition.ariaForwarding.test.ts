import { render, screen } from "@testing-library/svelte";
import TooltipDefinitionAria from "./TooltipDefinition.ariaForwarding.test.svelte";

describe("TooltipDefinition aria forwarding", () => {
  it("joins a consumer aria-describedby after the tooltip id", () => {
    render(TooltipDefinitionAria, {
      props: { tooltipProps: { "aria-describedby": "extra-help" } },
    });

    const button = screen.getByRole("button", { name: "IBM" });
    expect(button).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
    expect(button).toHaveAccessibleDescription("Armonk, New York Extra help");
    expect(screen.getByTestId("tooltip-wrapper")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("names the button with a consumer aria-labelledby", () => {
    render(TooltipDefinitionAria, {
      props: { tooltipProps: { "aria-labelledby": "external-name" } },
    });

    expect(
      screen.getByRole("button", { name: "External name" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-wrapper")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("names the button with a consumer aria-label", () => {
    render(TooltipDefinitionAria, {
      props: { tooltipProps: { "aria-label": "Consumer label" } },
    });

    expect(
      screen.getByRole("button", { name: "Consumer label" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-wrapper")).not.toHaveAttribute(
      "aria-label",
    );
  });
});
