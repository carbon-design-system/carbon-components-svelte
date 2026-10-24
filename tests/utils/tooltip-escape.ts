import { fireEvent } from "@testing-library/svelte";

/** Press Escape on the focused element, or the body. */
export function pressEscape(init: KeyboardEventInit = {}) {
  return fireEvent.keyDown(document.activeElement ?? document.body, {
    key: "Escape",
    ...init,
  });
}

export type TooltipEscapeSetup = () => {
  /** Element that opens the tooltip on hover and focus. */
  trigger: HTMLElement;
  /** Another focusable element outside the trigger. */
  other: HTMLElement;
  /** `true` while the tooltip shows. Read only while hovered or focused. */
  shown: () => boolean;
  /** Keydown listener on an ancestor of the trigger. */
  onParentKeydown: ReturnType<typeof vi.fn>;
};

/**
 * Escape contract for a hover and focus tooltip (WCAG 1.4.13), as the
 * icon-only `Button` has it: Escape hides the tooltip without moving focus,
 * stops there only when it hid something, ignores an IME composition, and
 * the tooltip shows again on the next pointer enter or focus.
 */
export function describeTooltipEscape(
  name: string,
  setup: TooltipEscapeSetup,
  { enterDelayMs = 100 }: { enterDelayMs?: number } = {},
) {
  describe(`${name} tooltip and Escape`, () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    async function focus(element: HTMLElement) {
      element.focus();
      await vi.advanceTimersByTimeAsync(0);
    }

    async function hover(element: HTMLElement) {
      await fireEvent.mouseEnter(element);
      await vi.advanceTimersByTimeAsync(enterDelayMs);
    }

    it("hides a focused tooltip, keeps focus, and stops the key there", async () => {
      const { trigger, shown, onParentKeydown } = setup();

      await focus(trigger);
      expect(shown()).toBe(true);

      await pressEscape();
      expect(shown()).toBe(false);
      expect(trigger).toHaveFocus();
      expect(onParentKeydown).not.toHaveBeenCalled();

      // With nothing left to hide, Escape reaches ancestors.
      await pressEscape();
      expect(onParentKeydown).toHaveBeenCalledOnce();
    });

    it("hides a hovered tooltip while focus is elsewhere", async () => {
      const { trigger, other, shown, onParentKeydown } = setup();

      await focus(other);
      await hover(trigger);
      expect(shown()).toBe(true);

      await pressEscape();
      expect(shown()).toBe(false);
      expect(other).toHaveFocus();
      expect(onParentKeydown).not.toHaveBeenCalled();
    });

    it("shows the tooltip again on the next pointer enter or focus", async () => {
      const { trigger, shown } = setup();

      await focus(trigger);
      await pressEscape();
      await hover(trigger);
      expect(shown()).toBe(true);

      await pressEscape();
      // Still hovered and focused: the tooltip stays hidden.
      await vi.advanceTimersByTimeAsync(1000);
      expect(shown()).toBe(false);

      trigger.blur();
      await focus(trigger);
      expect(shown()).toBe(true);
    });

    it.each([{ init: { isComposing: true } }, { init: { keyCode: 229 } }])(
      "ignores Escape during IME composition ($init)",
      async ({ init }) => {
        const { trigger, shown, onParentKeydown } = setup();

        await focus(trigger);
        await pressEscape(init);
        expect(shown()).toBe(true);
        expect(onParentKeydown).toHaveBeenCalledOnce();
      },
    );
  });
}
