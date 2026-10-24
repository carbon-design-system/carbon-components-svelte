import { render, screen } from "@testing-library/svelte";
import { describeTooltipEscape } from "../utils/tooltip-escape";
import { describeTooltipHover } from "../utils/tooltip-hover";
import FileUploaderButtonEscape from "./FileUploaderButton.escape.test.svelte";

function setup() {
  const onParentKeydown = vi.fn();
  render(FileUploaderButtonEscape, { props: { onParentKeydown } });
  const trigger = screen.getByRole("button", { name: "Upload files" });
  return {
    trigger,
    other: screen.getByLabelText("Other control"),
    shown: () => trigger.classList.contains("bx--tooltip--visible"),
    onParentKeydown,
  };
}

describeTooltipEscape("Icon-only FileUploaderButton", setup, {
  enterDelayMs: 0,
});
describeTooltipHover("Icon-only FileUploaderButton", setup, {
  enterDelayMs: 0,
  portal: false,
});
