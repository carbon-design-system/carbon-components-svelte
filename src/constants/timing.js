// @ts-check

/**
 * Default hover/focus delay before a tooltip opens. Icon and button
 * tooltips skip it when another tooltip in the group is already open
 * (warm handoff).
 */
export const TOOLTIP_ENTER_DELAY_MS = 100;

/**
 * Default delay before a `Tooltip` or `TooltipDefinition` closes, so the
 * pointer can move onto it (Carbon v11 `Tooltip`).
 */
export const TOOLTIP_LEAVE_DELAY_MS = 300;

/**
 * Default delay before an icon tooltip closes, so the pointer can move
 * onto it (WCAG 1.4.13, Carbon v11 `IconButton`).
 */
export const TOOLTIP_ICON_LEAVE_DELAY_MS = 100;

/**
 * Default window after a tooltip closes during which the next tooltip in
 * the same group still opens without the enter delay or fade.
 */
export const TOOLTIP_SKIP_DELAY_MS = 300;

/** Hover-intent delay to open or close a submenu (Carbon moderate-01). */
export const SUBMENU_HOVER_DELAY_MS = 150;

/**
 * Interval to re-check a pointer that left a submenu's item while moving
 * toward the submenu. Each check holds the close for one more interval
 * while the pointer keeps aiming at it, so a pointer still for this long
 * has paused and the close goes ahead.
 */
export const SUBMENU_AIM_PAUSE_MS = 100;

/**
 * Default hover delay before a resize separator (`Splitter`) highlights and
 * shows the resize cursor (Carbon moderate-01).
 */
export const SEPARATOR_HOVER_DELAY_MS = 150;

/** Idle time before a type-ahead search buffer resets. */
export const TYPEAHEAD_RESET_MS = 500;

/**
 * Default time `loading` stays `true` before a loading indicator shows, so
 * fast work shows none.
 */
export const LOADING_DELAY_MS = 300;

/**
 * Default minimum time a loading indicator stays once shown, so it does not
 * flash.
 */
export const LOADING_MIN_DURATION_MS = 500;

/**
 * How long `NotificationQueue` waits before it removes the empty space a
 * closed toast held under the pointer. It matches the collapse transition
 * (Carbon moderate-01), and the space is already zero under reduced motion.
 */
export const NOTIFICATION_QUEUE_COLLAPSE_MS = 150;

/**
 * How long a stepper button is held before it starts to repeat, so a click
 * steps once.
 */
export const STEPPER_REPEAT_DELAY_MS = 400;

/** Time between steps while a stepper button stays held (Chromium spin button). */
export const STEPPER_REPEAT_INTERVAL_MS = 50;
