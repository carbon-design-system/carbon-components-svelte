import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { describeTooltipEscape, pressEscape } from "../utils/tooltip-escape";
import { describeTooltipHover } from "../utils/tooltip-hover";
import HeaderActionEscape from "./HeaderAction.escape.test.svelte";

function setup(props: { isOpen?: boolean } = {}) {
  const onParentKeydown = vi.fn();
  render(HeaderActionEscape, { props: { ...props, onParentKeydown } });
  const trigger = screen.getByRole("button", { name: "Notifications" });
  return {
    trigger,
    other: screen.getByLabelText("Other control"),
    shown: () => trigger.classList.contains("bx--tooltip--visible"),
    onParentKeydown,
  };
}

describeTooltipEscape("Icon-only HeaderAction", setup, { enterDelayMs: 0 });
describeTooltipHover("Icon-only HeaderAction", setup, {
  enterDelayMs: 0,
  portal: false,
});

describe("HeaderAction tooltip with the panel open", () => {
  it("hides the tooltip and closes the panel with one Escape", async () => {
    const { trigger, shown } = setup({ isOpen: true });

    trigger.focus();
    await tick();
    expect(shown()).toBe(true);

    await pressEscape();
    expect(shown()).toBe(false);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("keeps the tooltip closed when closing the panel returns focus", async () => {
    const { trigger, shown } = setup({ isOpen: true });

    screen.getByRole("link", { name: "Alert settings" }).focus();
    await pressEscape();
    await tick();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(shown()).toBe(false);

    await fireEvent.mouseEnter(trigger);
    expect(shown()).toBe(true);
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
