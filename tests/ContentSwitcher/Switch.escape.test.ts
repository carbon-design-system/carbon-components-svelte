import { render, screen } from "@testing-library/svelte";
import { openTooltips } from "../utils/open-tooltips";
import { describeTooltipEscape } from "../utils/tooltip-escape";
import { describeTooltipHover } from "../utils/tooltip-hover";
import SwitchEscape from "./Switch.escape.test.svelte";

function setup() {
  const onParentKeydown = vi.fn();
  render(SwitchEscape, { props: { onParentKeydown } });
  return {
    trigger: screen.getByRole("tab", { name: "Grid view" }),
    other: screen.getByLabelText("Other control"),
    shown: () =>
      openTooltips().some((tooltip) => tooltip.textContent === "Grid view"),
    onParentKeydown,
  };
}

describeTooltipEscape("Icon-only Switch", setup);
describeTooltipHover("Icon-only Switch", setup);
