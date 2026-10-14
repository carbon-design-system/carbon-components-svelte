import { render, screen } from "@testing-library/svelte";
import TooltipAria from "./Tooltip.ariaForwarding.test.svelte";

describe("Tooltip aria forwarding", () => {
  describe.each([false, true])("hideIcon: %s", (hideIcon) => {
    it("joins a consumer aria-describedby after the open tooltip id", () => {
      render(TooltipAria, {
        props: {
          hideIcon,
          open: true,
          tooltipProps: { "aria-describedby": "extra-help" },
        },
      });

      const trigger = screen.getByRole("button", { name: "Resources" });
      expect(trigger).toHaveAttribute(
        "aria-describedby",
        expect.stringMatching(/^\S+ extra-help$/),
      );
      expect(trigger).toHaveAccessibleDescription("Tip content Extra help");
      expect(screen.getByTestId("tooltip-wrapper")).not.toHaveAttribute(
        "aria-describedby",
      );
    });

    it("names the trigger with a consumer aria-labelledby", () => {
      render(TooltipAria, {
        props: {
          hideIcon,
          tooltipProps: { "aria-labelledby": "external-name" },
        },
      });

      expect(
        screen.getByRole("button", { name: "External name" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("tooltip-wrapper")).not.toHaveAttribute(
        "aria-labelledby",
      );
    });

    it("lets a consumer aria-label replace the trigger text name", () => {
      render(TooltipAria, {
        props: {
          hideIcon,
          tooltipProps: { "aria-label": "Consumer label" },
        },
      });

      const trigger = screen.getByRole("button", { name: "Consumer label" });
      expect(trigger).not.toHaveAttribute("aria-labelledby");
      expect(screen.getByTestId("tooltip-wrapper")).not.toHaveAttribute(
        "aria-label",
      );
    });
  });

  it("keeps a consumer aria-describedby while closed", () => {
    render(TooltipAria, {
      props: { tooltipProps: { "aria-describedby": "extra-help" } },
    });

    const trigger = screen.getByRole("button", { name: "Resources" });
    expect(trigger).toHaveAttribute("aria-describedby", "extra-help");
    expect(trigger).toHaveAccessibleDescription("Extra help");
  });

  it("lets a consumer aria-label win over iconDescription", () => {
    render(TooltipAria, {
      props: {
        triggerText: "",
        tooltipProps: { "aria-label": "Consumer label" },
      },
    });

    expect(
      screen.getByRole("button", { name: "Consumer label" }),
    ).toBeInTheDocument();
  });
});
