/**
 * Default hover/focus delay before a tooltip opens. Icon and button
 * tooltips skip it when another tooltip in the group is already open
 * (warm handoff).
 */
export const TOOLTIP_ENTER_DELAY_MS: 100;

/**
 * Default delay before a `Tooltip` or `TooltipDefinition` closes, so the
 * pointer can move onto it (Carbon v11 `Tooltip`).
 */
export const TOOLTIP_LEAVE_DELAY_MS: 300;

/**
 * Default delay before an icon tooltip closes, so the pointer can move
 * onto it (WCAG 1.4.13, Carbon v11 `IconButton`).
 */
export const TOOLTIP_ICON_LEAVE_DELAY_MS: 100;

/**
 * Default window after a tooltip closes during which the next tooltip in
 * the same group still opens without the enter delay or fade.
 */
export const TOOLTIP_SKIP_DELAY_MS: 300;

/** Hover-intent delay to open or close a submenu (Carbon moderate-01). */
export const SUBMENU_HOVER_DELAY_MS: 150;

/**
 * Default hover delay before a resize separator (`Splitter`) highlights and
 * shows the resize cursor (Carbon moderate-01).
 */
export const SEPARATOR_HOVER_DELAY_MS: 150;

/** Idle time before a type-ahead search buffer resets. */
export const TYPEAHEAD_RESET_MS: 500;

/**
 * Time to wait for more arrivals before a live region announces them, so a
 * burst reads as one count ("3 new notifications") and not one per item.
 */
export const ANNOUNCE_BATCH_MS: 300;
