import { render, screen } from "@testing-library/svelte";
import { openTooltips } from "../utils/open-tooltips";
import { describeTooltipEscape } from "../utils/tooltip-escape";
import ToggleButtonEscape from "./ToggleButton.escape.test.svelte";

describeTooltipEscape("Icon-only ToggleButton", () => {
  const onParentKeydown = vi.fn();
  render(ToggleButtonEscape, { props: { onParentKeydown } });
  return {
    trigger: screen.getByRole("button", { name: "Bold" }),
    other: screen.getByLabelText("Other control"),
    shown: () =>
      openTooltips().some((tooltip) => tooltip.textContent === "Bold"),
    onParentKeydown,
  };
});
