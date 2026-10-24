import { fireEvent } from "@testing-library/svelte";
import { TOOLTIP_ICON_LEAVE_DELAY_MS } from "../../src/constants/timing.js";
import { focusQuietly } from "../../src/utils/focus.js";
import { pressEscape } from "./tooltip-escape";

export type TooltipHoverSetup = () => {
  /** Element that opens the tooltip on hover and focus. */
  trigger: HTMLElement;
  /** `true` while the tooltip shows. */
  shown: () => boolean;
  /** Keydown listener on an ancestor of the trigger. */
  onParentKeydown: ReturnType<typeof vi.fn>;
};

/** The portalled tooltip's root, the element the pointer moves onto. */
function portalTooltip() {
  const tooltip = document.querySelector(".bx--tooltip-portal");
  assert(tooltip);
  return tooltip;
}

/**
 * Pointer and focus contract for an icon tooltip (WCAG 1.4.13): it waits
 * out the leave delay, stays while the pointer is on a portalled tooltip,
 * and stays closed for focus the library moves itself. An inline tooltip
 * sits inside its trigger, so the pointer on it never leaves the trigger.
 */
export function describeTooltipHover(
  name: string,
  setup: TooltipHoverSetup,
  {
    enterDelayMs = 100,
    portal = true,
  }: { enterDelayMs?: number; portal?: boolean } = {},
) {
  describe(`${name} tooltip and the pointer`, () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    async function hover(element: Element) {
      await fireEvent.mouseEnter(element);
      await vi.advanceTimersByTimeAsync(enterDelayMs);
    }

    it("stays for the leave delay after the pointer leaves", async () => {
      const { trigger, shown } = setup();

      await hover(trigger);
      expect(shown()).toBe(true);

      await fireEvent.mouseLeave(trigger);
      await vi.advanceTimersByTimeAsync(TOOLTIP_ICON_LEAVE_DELAY_MS - 1);
      expect(shown()).toBe(true);
      await vi.advanceTimersByTimeAsync(1);
      expect(shown()).toBe(false);
    });

    it.runIf(portal)(
      "stays while the pointer is on the tooltip, and closes after it leaves",
      async () => {
        const { trigger, shown } = setup();

        await hover(trigger);
        await fireEvent.mouseLeave(trigger);
        await fireEvent.mouseEnter(portalTooltip());
        await vi.advanceTimersByTimeAsync(1000);
        expect(shown()).toBe(true);

        await fireEvent.mouseLeave(portalTooltip());
        await vi.advanceTimersByTimeAsync(TOOLTIP_ICON_LEAVE_DELAY_MS - 1);
        expect(shown()).toBe(true);
        await vi.advanceTimersByTimeAsync(1);
        expect(shown()).toBe(false);
      },
    );

    it("stays closed for focus the library moves, and shows for the user's", async () => {
      const { trigger, shown, onParentKeydown } = setup();

      focusQuietly(trigger);
      await vi.advanceTimersByTimeAsync(0);
      expect(trigger).toHaveFocus();
      expect(shown()).toBe(false);

      // Nothing to hide, so Escape reaches ancestors, such as a dialog.
      await pressEscape();
      expect(onParentKeydown).toHaveBeenCalledOnce();

      trigger.blur();
      trigger.focus();
      await vi.advanceTimersByTimeAsync(0);
      expect(shown()).toBe(true);
    });
  });
}
