import { render, screen } from "@testing-library/svelte";
import { openTooltips } from "../utils/open-tooltips";
import { describeTooltipEscape } from "../utils/tooltip-escape";
import { describeTooltipHover } from "../utils/tooltip-hover";
import { user } from "../utils/user";
import SearchTooltip from "./Search.tooltip.test.svelte";

describe.each([
  { mode: "inline", portalTooltip: false },
  { mode: "portal", portalTooltip: true },
])("Search collapsed tooltip $mode", ({ portalTooltip }) => {
  function setup() {
    const onParentKeydown = vi.fn();
    render(SearchTooltip, { props: { portalTooltip, onParentKeydown } });
    const trigger = screen.getByRole("button", { name: "Search catalog" });
    return {
      trigger,
      other: screen.getByLabelText("Other control"),
      shown: () =>
        portalTooltip
          ? openTooltips().length === 1
          : trigger.classList.contains("bx--tooltip--visible"),
      onParentKeydown,
    };
  }

  describeTooltipEscape("Magnifier", setup);
  describeTooltipHover("Magnifier", setup, {
    portal: portalTooltip,
  });

  it("draws no tooltip with hideTooltip and keeps the name", async () => {
    render(SearchTooltip, { props: { portalTooltip, hideTooltip: true } });
    const trigger = screen.getByRole("button", { name: "Search catalog" });
    expect(trigger).toHaveAttribute("aria-label", "Search catalog");
    expect(trigger).not.toHaveClass("bx--tooltip__trigger");

    await user.hover(trigger);
    await user.tab();
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(document.querySelector(".bx--tooltip--visible")).toBeNull();
    expect(openTooltips()).toHaveLength(0);
  });

  it("hides the tooltip once the field expands", async () => {
    const { trigger, shown } = setup();
    await user.hover(trigger);
    await vi.waitFor(() => expect(shown()).toBe(true));
    await user.click(trigger);
    expect(trigger).not.toBeInTheDocument();
    expect(document.querySelector(".bx--tooltip--visible")).toBeNull();
    expect(openTooltips()).toHaveLength(0);
  });

  it("draws no tooltip when disabled", () => {
    render(SearchTooltip, { props: { portalTooltip, disabled: true } });
    const trigger = screen.getByRole("button", { name: "Search catalog" });
    expect(trigger.querySelector(".bx--assistive-text")).toBeNull();
  });
});

it("draws no tooltip on a search that isn't expandable", () => {
  render(SearchTooltip, { props: { expanded: true } });
  expect(document.querySelector(".bx--tooltip__trigger")).toBeNull();
});
