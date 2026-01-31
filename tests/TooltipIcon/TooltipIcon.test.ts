import { render, screen } from "@testing-library/svelte";
import type { TooltipIcon as TooltipIconSource } from "carbon-components-svelte";
import type { ComponentProps } from "svelte";
import { user } from "../setup-tests";
import TooltipIconSize from "./TooltipIcon.size.test.svelte";
import TooltipIcon from "./TooltipIcon.test.svelte";

type Props = ComponentProps<TooltipIconSource>;

describe("TooltipIcon", () => {
  it("should render with default props", () => {
    render(TooltipIcon);

    expect(screen.getByText("Test tooltip text")).toBeInTheDocument();
  });

  it("should show and hide the tooltip", async () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    await user.hover(trigger);

    expect(trigger).not.toHaveClass("bx--tooltip--hidden");

    await user.keyboard("{Escape}");
    expect(screen.getByRole("button")).toHaveClass("bx--tooltip--hidden");
  });

  it("should show tooltip on focus", async () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    await user.tab();

    expect(trigger).not.toHaveClass("bx--tooltip--hidden");
  });

  it("should hide tooltip on Escape key", async () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    await user.hover(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveClass("bx--tooltip--hidden");
  });

  describe("tooltip positioning", () => {
    test.each([
      ["top", "bx--tooltip--top"],
      ["right", "bx--tooltip--right"],
      ["bottom", "bx--tooltip--bottom"],
      ["left", "bx--tooltip--left"],
    ] as const)("should support %s direction", (direction, expectedClass) => {
      render(TooltipIcon, {
        props: { direction },
      });

      const trigger = screen.getByRole("button");
      expect(trigger).toHaveClass(expectedClass);
    });

    test.each([
      ["start", "bx--tooltip--align-start"],
      ["center", "bx--tooltip--align-center"],
      ["end", "bx--tooltip--align-end"],
    ] as const)("should support %s alignment", (align, expectedClass) => {
      render(TooltipIcon, {
        props: { align },
      });

      const trigger = screen.getByRole("button");
      expect(trigger).toHaveClass(expectedClass);
    });
  });

  it("should support disabled state", () => {
    render(TooltipIcon, {
      props: { disabled: true },
    });

    const trigger = screen.getByRole("button");
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveStyle({ cursor: "not-allowed" });
    expect(trigger).toHaveClass("bx--tooltip--hidden");
  });

  it("should not show tooltip when disabled", async () => {
    render(TooltipIcon, {
      props: { disabled: true },
    });

    const trigger = screen.getByRole("button");
    await user.hover(trigger);

    expect(trigger).toHaveClass("bx--tooltip--hidden");
  });

  it("should support custom tooltip text", () => {
    render(TooltipIcon, {
      props: { tooltipText: "Custom tooltip" },
    });

    expect(screen.getByText("Custom tooltip")).toBeInTheDocument();
  });

  it("should use provided id for tooltip", () => {
    render(TooltipIcon, {
      props: { id: "custom-id" },
    });

    const tooltip = screen.getByRole("button");
    expect(tooltip).toHaveAttribute("aria-describedby", "custom-id");
  });

  it("should have correct ARIA attributes", () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    const tooltip = screen.getByText("Test tooltip text");

    expect(trigger).toHaveAttribute("aria-describedby", "test-tooltip");
    expect(tooltip).toHaveClass("bx--assistive-text");
  });

  describe("size", () => {
    it("should render with default size (16)", () => {
      render(TooltipIconSize);

      const icon = screen.getByTestId("mock-icon");
      expect(icon).toHaveAttribute("width", "16");
      expect(icon).toHaveAttribute("height", "16");
    });

    test.each([
      [16, "16"],
      [20, "20"],
      [24, "24"],
      [32, "32"],
    ] as const)("should pass size %i to icon", (size, expected) => {
      render(TooltipIconSize, {
        props: { size },
      });

      const icon = screen.getByTestId("mock-icon");
      expect(icon).toHaveAttribute("width", expected);
      expect(icon).toHaveAttribute("height", expected);
    });

    it("should type size prop: 16/20/24/32 and any number are valid", () => {
      expectTypeOf<16>().toExtend<Props["size"]>();
      expectTypeOf<20>().toExtend<Props["size"]>();
      expectTypeOf<24>().toExtend<Props["size"]>();
      expectTypeOf<32>().toExtend<Props["size"]>();
      expectTypeOf<number>().toExtend<NonNullable<Props["size"]>>();
    });
  });
});
