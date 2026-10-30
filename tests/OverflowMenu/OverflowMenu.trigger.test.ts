import { fireEvent, render, screen } from "@testing-library/svelte";
import {
  TOOLTIP_ENTER_DELAY_MS,
  TOOLTIP_ICON_LEAVE_DELAY_MS,
} from "../../src/constants/timing.js";
import { rootTooltipGroup } from "../../src/utils/tooltip-group.js";
import { openTooltips } from "../utils/open-tooltips";
import { describeTooltipHover } from "../utils/tooltip-hover";
import OverflowMenuTrigger from "./OverflowMenu.trigger.test.svelte";

function tooltipTexts() {
  return openTooltips().map((tooltip) => tooltip.textContent?.trim());
}

function pressEscape() {
  return fireEvent.keyDown(document.activeElement ?? document.body, {
    key: "Escape",
  });
}

describe("OverflowMenu trigger name", () => {
  it.each([
    { iconDescription: undefined, name: "Options" },
    { iconDescription: "Service actions", name: "Service actions" },
  ])(
    "names the trigger and the menu $name",
    async ({ iconDescription, name }) => {
      render(OverflowMenuTrigger, { props: { iconDescription } });
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveAccessibleName(name);

      await fireEvent.click(trigger);
      expect(screen.getByRole("menu")).toHaveAccessibleName(name);
    },
  );

  it("lets an aria-label name the trigger and the menu, not the tooltip", async () => {
    render(OverflowMenuTrigger, {
      props: { ariaLabel: "Actions for API Gateway service" },
    });
    const trigger = screen.getByTestId("trigger");
    expect(trigger).toHaveAccessibleName("Actions for API Gateway service");

    trigger.focus();
    await vi.waitFor(() => expect(tooltipTexts()).toEqual(["Options"]));

    await fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toHaveAccessibleName(
      "Actions for API Gateway service",
    );
  });

  it("names a custom trigger by its content", () => {
    render(OverflowMenuTrigger);
    const custom = screen.getByTestId("custom");
    expect(custom).toHaveAccessibleName("Service actions");
    expect(custom).not.toHaveAttribute("aria-label");
  });

  it("has no native title, so the name isn't announced twice", () => {
    render(OverflowMenuTrigger);
    const trigger = screen.getByTestId("trigger");

    expect(trigger.querySelector("title")).toBeNull();
    expect(trigger.querySelector("[title]")).toBeNull();
    expect(trigger.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("OverflowMenu trigger tooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Start outside the group's skip window, whatever ran before.
    rootTooltipGroup.scope.releasedAt = Number.NEGATIVE_INFINITY;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows on hover after the enter delay and hides on leave", async () => {
    render(OverflowMenuTrigger);
    const trigger = screen.getByTestId("trigger");

    await fireEvent.mouseEnter(trigger);
    expect(openTooltips()).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(TOOLTIP_ENTER_DELAY_MS);
    expect(tooltipTexts()).toEqual(["Options"]);

    await fireEvent.mouseLeave(trigger);
    await vi.advanceTimersByTimeAsync(TOOLTIP_ICON_LEAVE_DELAY_MS - 1);
    expect(tooltipTexts()).toEqual(["Options"]);
    await vi.advanceTimersByTimeAsync(1);
    expect(openTooltips()).toHaveLength(0);
  });

  it("shows at once on focus and hides on blur", async () => {
    render(OverflowMenuTrigger);
    const trigger = screen.getByTestId("trigger");

    trigger.focus();
    await vi.advanceTimersByTimeAsync(0);
    expect(tooltipTexts()).toEqual(["Options"]);

    trigger.blur();
    await vi.advanceTimersByTimeAsync(0);
    expect(openTooltips()).toHaveLength(0);
  });

  it("hides while the menu is open, and after the closing click until the next enter", async () => {
    render(OverflowMenuTrigger);
    const trigger = screen.getByTestId("trigger");

    await fireEvent.mouseEnter(trigger);
    await vi.advanceTimersByTimeAsync(TOOLTIP_ENTER_DELAY_MS);
    expect(openTooltips()).toHaveLength(1);

    await fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(openTooltips()).toHaveLength(0);

    await fireEvent.mouseLeave(trigger);
    await fireEvent.mouseEnter(trigger);
    await vi.advanceTimersByTimeAsync(TOOLTIP_ENTER_DELAY_MS);
    expect(openTooltips()).toHaveLength(0);

    await fireEvent.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(TOOLTIP_ENTER_DELAY_MS);
    expect(openTooltips()).toHaveLength(0);

    await fireEvent.mouseLeave(trigger);
    await fireEvent.mouseEnter(trigger);
    await vi.advanceTimersByTimeAsync(TOOLTIP_ENTER_DELAY_MS);
    expect(openTooltips()).toHaveLength(1);
  });

  it("returns focus without the tooltip when Escape closes the menu", async () => {
    render(OverflowMenuTrigger);
    const trigger = screen.getByTestId("trigger");

    trigger.focus();
    await fireEvent.click(trigger);
    await vi.advanceTimersByTimeAsync(0);
    expect(
      screen.getByRole("menuitem", { name: "Manage credentials" }),
    ).toHaveFocus();

    await pressEscape();
    expect(trigger).toHaveFocus();
    expect(openTooltips()).toHaveLength(0);

    trigger.blur();
    trigger.focus();
    await vi.advanceTimersByTimeAsync(0);
    expect(openTooltips()).toHaveLength(1);
  });

  it("hides on Escape, keeps focus, and stops the key there", async () => {
    const onParentKeydown = vi.fn();
    render(OverflowMenuTrigger, { props: { onParentKeydown } });
    const trigger = screen.getByTestId("trigger");

    trigger.focus();
    await vi.advanceTimersByTimeAsync(0);
    expect(openTooltips()).toHaveLength(1);

    await pressEscape();
    expect(openTooltips()).toHaveLength(0);
    expect(trigger).toHaveFocus();
    expect(onParentKeydown).not.toHaveBeenCalled();

    // With nothing left to dismiss, Escape reaches ancestors.
    await pressEscape();
    expect(onParentKeydown).toHaveBeenCalledTimes(1);
  });

  it("hands off to a neighbor, so one tooltip shows at a time", async () => {
    render(OverflowMenuTrigger);

    screen.getByTestId("trigger").focus();
    await vi.advanceTimersByTimeAsync(0);
    expect(tooltipTexts()).toEqual(["Options"]);

    await fireEvent.mouseEnter(screen.getByTestId("neighbor"));
    await vi.advanceTimersByTimeAsync(0);
    expect(tooltipTexts()).toEqual(["Rotate keys"]);
  });

  it("does not show for a custom trigger", async () => {
    render(OverflowMenuTrigger);
    const custom = screen.getByTestId("custom");

    custom.focus();
    await fireEvent.mouseEnter(custom);
    await vi.advanceTimersByTimeAsync(TOOLTIP_ENTER_DELAY_MS);
    expect(openTooltips()).toHaveLength(0);
  });

  it("does not show for a disabled trigger", async () => {
    render(OverflowMenuTrigger, { props: { disabled: true } });

    await fireEvent.mouseEnter(screen.getByTestId("trigger"));
    await vi.advanceTimersByTimeAsync(TOOLTIP_ENTER_DELAY_MS);
    expect(openTooltips()).toHaveLength(0);
  });

  it("places the tooltip on the side set by tooltipPosition", async () => {
    render(OverflowMenuTrigger, { props: { tooltipPosition: "bottom" } });

    screen.getByTestId("trigger").focus();
    await vi.advanceTimersByTimeAsync(0);
    expect(document.querySelector(".bx--tooltip-portal")).toHaveAttribute(
      "data-direction",
      "bottom",
    );
  });

  it("places the tooltip by tooltipAlign over the older props", async () => {
    render(OverflowMenuTrigger, {
      props: { tooltipPosition: "top", tooltipAlign: "bottom-end" },
    });

    screen.getByTestId("trigger").focus();
    await vi.advanceTimersByTimeAsync(0);
    expect(document.querySelector(".bx--tooltip-portal")).toHaveAttribute(
      "data-direction",
      "bottom",
    );
    expect(document.querySelector("[data-floating-portal]")).toHaveAttribute(
      "data-floating-intrinsic-align",
      "end",
    );
  });
});

describeTooltipHover("OverflowMenu trigger", () => {
  const onParentKeydown = vi.fn();
  render(OverflowMenuTrigger, { props: { onParentKeydown } });
  return {
    trigger: screen.getByTestId("trigger"),
    shown: () => openTooltips().length === 1,
    onParentKeydown,
  };
});
