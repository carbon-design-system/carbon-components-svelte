/**
 * Default hover/focus delay before a tooltip opens. Icon and button
 * tooltips skip it when another tooltip in the group is already open
 * (warm handoff).
 */
export const TOOLTIP_ENTER_DELAY_MS: 100;

/**
 * Default delay before a hoverable tooltip (`Tooltip`, `TooltipDefinition`)
 * closes, so the pointer can move onto it. Icon labels close at once.
 */
export const TOOLTIP_LEAVE_DELAY_MS: 300;

/**
 * Default window after a tooltip closes during which the next tooltip in
 * the same group still opens without the enter delay or fade.
 */
export const TOOLTIP_SKIP_DELAY_MS: 300;

/** Hover-intent delay to open or close a submenu (Carbon moderate-01). */
export const SUBMENU_HOVER_DELAY_MS: 150;

/** Idle time before a type-ahead search buffer resets. */
export const TYPEAHEAD_RESET_MS: 500;
