import { fireEvent, render, screen } from "@testing-library/svelte";
import { describeTooltipEscape, pressEscape } from "../utils/tooltip-escape";
import HeaderActionEscape from "./HeaderAction.escape.test.svelte";

function setup(props: { isOpen?: boolean } = {}) {
  const onParentKeydown = vi.fn();
  render(HeaderActionEscape, { props: { ...props, onParentKeydown } });
  const trigger = screen.getByRole("button", { name: "Notifications" });
  return {
    trigger,
    other: screen.getByLabelText("Other control"),
    // CSS shows the tooltip on hover or focus unless the
    // `bx--tooltip--hidden` class holds it back.
    shown: () => !trigger.classList.contains("bx--tooltip--hidden"),
    onParentKeydown,
  };
}

describeTooltipEscape("Icon-only HeaderAction", setup, { enterDelayMs: 0 });

describe("HeaderAction tooltip with the panel open", () => {
  it("hides the tooltip and closes the panel with one Escape", async () => {
    const { trigger, shown } = setup({ isOpen: true });

    trigger.focus();
    expect(shown()).toBe(true);

    await pressEscape();
    expect(shown()).toBe(false);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("closes the panel while the pointer is still on the trigger", async () => {
    vi.useFakeTimers();
    try {
      const { trigger, other, shown, onParentKeydown } = setup({
        isOpen: true,
      });

      other.focus();
      await fireEvent.mouseEnter(trigger);
      expect(shown()).toBe(true);

      await pressEscape();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).toHaveFocus();
      expect(onParentKeydown).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
});
