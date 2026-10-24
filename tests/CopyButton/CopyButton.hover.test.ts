import { render, screen } from "@testing-library/svelte";
import { openTooltips } from "../utils/open-tooltips";
import { describeTooltipHover } from "../utils/tooltip-hover";
import CopyButtonHover from "./CopyButton.hover.test.svelte";

describeTooltipHover("CopyButton", () => {
  const onParentKeydown = vi.fn();
  render(CopyButtonHover, { props: { onParentKeydown } });
  return {
    trigger: screen.getByRole("button", { name: "Copy region" }),
    shown: () => openTooltips().length === 1,
    onParentKeydown,
  };
});
