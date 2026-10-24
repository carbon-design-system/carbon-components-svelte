import { render, screen } from "@testing-library/svelte";
import { openTooltips } from "../utils/open-tooltips";
import { describeTooltipEscape } from "../utils/tooltip-escape";
import { describeTooltipHover } from "../utils/tooltip-hover";
import TabEscape from "./Tab.escape.test.svelte";

function setup() {
  const onParentKeydown = vi.fn();
  render(TabEscape, { props: { onParentKeydown } });
  return {
    trigger: screen.getByRole("tab", { name: "Dashboard" }),
    other: screen.getByLabelText("Other control"),
    shown: () =>
      openTooltips().some((tooltip) => tooltip.textContent === "Dashboard"),
    onParentKeydown,
  };
}

describeTooltipEscape("Icon-only Tab", setup);
describeTooltipHover("Icon-only Tab", setup);
