import { render, screen } from "@testing-library/svelte";
import { describeTooltipEscape } from "../utils/tooltip-escape";
import FileUploaderButtonEscape from "./FileUploaderButton.escape.test.svelte";

describeTooltipEscape(
  "Icon-only FileUploaderButton",
  () => {
    const onParentKeydown = vi.fn();
    render(FileUploaderButtonEscape, { props: { onParentKeydown } });
    const trigger = screen.getByRole("button", { name: "Upload files" });
    return {
      trigger,
      other: screen.getByLabelText("Other control"),
      // CSS shows the tooltip on hover or focus unless the
      // `bx--tooltip--hidden` class holds it back.
      shown: () => !trigger.classList.contains("bx--tooltip--hidden"),
      onParentKeydown,
    };
  },
  { enterDelayMs: 0 },
);
