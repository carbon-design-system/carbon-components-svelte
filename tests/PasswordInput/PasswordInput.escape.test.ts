import { render, screen } from "@testing-library/svelte";
import { openTooltips } from "../utils/open-tooltips";
import { describeTooltipEscape } from "../utils/tooltip-escape";
import PasswordInputEscape from "./PasswordInput.escape.test.svelte";

describe.each([
  { mode: "inline", portalTooltip: false },
  { mode: "portal", portalTooltip: true },
])("PasswordInput $mode", ({ portalTooltip }) => {
  describeTooltipEscape(
    "Visibility toggle",
    () => {
      const onParentKeydown = vi.fn();
      render(PasswordInputEscape, {
        props: { portalTooltip, onParentKeydown },
      });
      const trigger = screen.getByRole("button", { name: "Show password" });
      return {
        trigger,
        other: screen.getByLabelText("Other control"),
        // Inline, CSS shows the tooltip on hover or focus unless the
        // `bx--tooltip--hidden` class holds it back.
        shown: () =>
          portalTooltip
            ? openTooltips().length === 1
            : !trigger.classList.contains("bx--tooltip--hidden"),
        onParentKeydown,
      };
    },
    { enterDelayMs: 0 },
  );
});
