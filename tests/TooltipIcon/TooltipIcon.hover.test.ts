import { render, screen } from "@testing-library/svelte";
import { openTooltips } from "../utils/open-tooltips";
import { describeTooltipHover } from "../utils/tooltip-hover";
import TooltipIconHover from "./TooltipIcon.hover.test.svelte";

describe.each([
  { mode: "inline", portalTooltip: false },
  { mode: "portal", portalTooltip: true },
])("TooltipIcon $mode", ({ portalTooltip }) => {
  describeTooltipHover(
    "TooltipIcon",
    () => {
      const onParentKeydown = vi.fn();
      render(TooltipIconHover, { props: { portalTooltip, onParentKeydown } });
      const trigger = screen.getByTestId("trigger");
      return {
        trigger,
        shown: () =>
          portalTooltip
            ? openTooltips().length === 1
            : trigger.classList.contains("bx--tooltip--visible"),
        onParentKeydown,
      };
    },
    { portal: portalTooltip },
  );
});
