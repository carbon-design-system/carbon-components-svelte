import { render, screen } from "@testing-library/svelte";
import { openTooltips } from "../utils/open-tooltips";
import { describeTooltipEscape } from "../utils/tooltip-escape";
import { describeTooltipHover } from "../utils/tooltip-hover";
import PasswordInputEscape from "./PasswordInput.escape.test.svelte";

describe.each([
  { mode: "inline", portalTooltip: false },
  { mode: "portal", portalTooltip: true },
])("PasswordInput $mode", ({ portalTooltip }) => {
  function setup() {
    const onParentKeydown = vi.fn();
    render(PasswordInputEscape, {
      props: { portalTooltip, onParentKeydown },
    });
    const trigger = screen.getByRole("button", { name: "Show password" });
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

  describeTooltipEscape("Visibility toggle", setup, { enterDelayMs: 0 });
  describeTooltipHover("Visibility toggle", setup, {
    enterDelayMs: 0,
    portal: portalTooltip,
  });
});
