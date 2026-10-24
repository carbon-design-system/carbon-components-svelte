/**
 * Keep a click on an inline tooltip from activating its trigger. Svelte
 * action for the trigger.
 */
export function ignoreTooltipClicks(node: HTMLElement): {
  destroy: () => void;
};
