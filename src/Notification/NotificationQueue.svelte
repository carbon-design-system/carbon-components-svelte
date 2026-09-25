<script>
  /**
   * @typedef {object} NotificationData
   * @property {string} [id] - Optional id for deduplication
   * @property {"error" | "info" | "info-square" | "success" | "warning" | "warning-alt"} [kind]
   * @property {string} [title]
   * @property {string} [subtitle]
   * @property {string} [caption]
   * @property {Date | number | string} [captionDate]
   * @property {number} [timeout]
   * @property {boolean} [lowContrast]
   * @property {string} [closeButtonDescription]
   * @property {boolean} [hideCloseButton]
   * @property {boolean} [pauseOnHover]
   * @property {boolean} [showTimeout]
   * @property {"alert" | "log" | "status" | "none"} [role] - Defaults to `"none"` in the queue, which is itself the live region
   * @property {boolean} [fullWidth]
   */

  /**
   * @typedef {"close-button" | "escape-key" | "timeout" | "overflow" | "programmatic"} NotificationDismissTrigger
   */

  /**
   * @event close
   * @type {object}
   * @property {string} id
   * @property {boolean} timeout
   * @property {"close-button" | "escape-key" | "timeout"} trigger
   * @event dismiss
   * @type {object}
   * @property {NotificationData & { id: string }} notification
   * @property {NotificationDismissTrigger} trigger
   */

  /**
   * Specify the position of the notification queue.
   * @type {"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"}
   */
  export let position = "top-right";

  /** Specify the top offset (CSS value) */
  export let offsetTop = "3rem";

  /** Specify the bottom offset (CSS value) */
  export let offsetBottom = "1rem";

  /** Specify the left offset (CSS value) */
  export let offsetLeft = "1rem";

  /** Specify the right offset (CSS value) */
  export let offsetRight = "1rem";

  /**
   * Specify the z-index of the notification queue.
   * By default, this matches the z-index of modals.
   */
  export let zIndex = 9000;

  /**
   * Specify the maximum number of notifications to display.
   * When this limit is exceeded, a notification is removed automatically;
   * `overflowPolicy` decides which.
   */
  export let maxNotifications = 3;

  /**
   * Specify which notification to remove when `maxNotifications` is exceeded.
   * `"oldest"` removes the oldest. `"low-priority"` removes `info`,
   * `info-square`, and `success` before `warning` and `warning-alt`, and those
   * before `error`, choosing the oldest within the same priority.
   * @type {"oldest" | "low-priority"}
   */
  export let overflowPolicy = "oldest";

  /**
   * Specify how many dismissed notifications to keep in `history`.
   * 0 (default) keeps none.
   */
  export let maxHistory = 0;

  /**
   * Dismissed notifications, newest first, each with the time it was
   * dismissed (`dismissedAt`, in ms). Holds at most `maxHistory` entries.
   * A notification counts as dismissed when it is closed, removed, cleared,
   * or dropped by `maxNotifications`.
   * @type {ReadonlyArray<NotificationData & { id: string; dismissedAt: number }>}
   * @bindable readonly
   */
  export let history = [];

  /**
   * Set to `true` to merge a new notification with the same `kind`, `title`,
   * and `subtitle` as a visible one into that row, showing a count on its
   * title and restarting its timeout. Id deduplication still runs first.
   */
  export let collapseDuplicates = false;

  import { createEventDispatcher } from "svelte";
  import ToastNotification from "./ToastNotification.svelte";

  const dispatch = createEventDispatcher();

  /** @type {Array<NotificationData & { id: string; timeoutKey?: number; count?: number }>} */
  let notifications = [];

  let idCounter = 0;

  function generateId() {
    return `notification-${idCounter++}`;
  }

  /**
   * A stored row without the queue's bookkeeping fields.
   * @param {NotificationData & { id: string; timeoutKey?: number; count?: number }} row
   * @returns {NotificationData & { id: string }}
   */
  function toNotificationData({ timeoutKey, count, ...notification }) {
    return notification;
  }

  $: if (history.length > maxHistory) {
    history = history.slice(0, Math.max(0, maxHistory));
  }

  /**
   * Record rows leaving the queue in `history`, then dispatch `dismiss`
   * for each. Every removal path goes through here.
   * @param {Array<NotificationData & { id: string; timeoutKey?: number; count?: number }>} rows in display order
   * @param {NotificationDismissTrigger} trigger
   */
  function dismissRows(rows, trigger) {
    if (rows.length === 0) return;
    const removed = rows.map(toNotificationData);

    if (maxHistory > 0) {
      const dismissedAt = Date.now();
      // Display order is newest first only for top positions.
      const newestFirst = isTopPosition(position)
        ? removed
        : [...removed].reverse();
      history = [
        ...newestFirst.map((notification) => ({
          ...notification,
          dismissedAt,
        })),
        ...history,
      ].slice(0, maxHistory);
    }

    for (const notification of removed) {
      dispatch("dismiss", { notification, trigger });
    }
  }

  function isTopPosition(value) {
    return value.startsWith("top");
  }

  function isLeftPosition(value) {
    return value.endsWith("left");
  }

  function isRightPosition(value) {
    return value.endsWith("right");
  }

  function isCenterPosition(value) {
    return value.endsWith("center");
  }

  /**
   * Add a notification to the queue.
   * If a notification with the same id already exists, the call is ignored.
   * To change an existing notification in place, use `update`.
   * With `collapseDuplicates`, a duplicate is merged into the existing row.
   * Returns the notification id (the provided or generated id, or the
   * existing row's id when collapsed).
   * @type {(notification: NotificationData) => string}
   */
  export function add(notification) {
    const id = notification.id ?? generateId();

    if (notifications.some((n) => n.id === id)) {
      return id;
    }

    if (collapseDuplicates) {
      const index = notifications.findIndex(
        (n) =>
          n.kind === notification.kind &&
          n.title === notification.title &&
          n.subtitle === notification.subtitle,
      );
      if (index !== -1) {
        const current = notifications[index];
        notifications[index] = {
          ...current,
          count: (current.count ?? 1) + 1,
          timeoutKey: (current.timeoutKey ?? 0) + 1,
        };
        notifications = notifications;
        return current.id;
      }
    }

    /** @type {NotificationData & { id: string }} */
    const newNotification = { ...notification, id };

    notifications = isTopPosition(position)
      ? [newNotification, ...notifications]
      : [...notifications, newNotification];
    dropOverflow();

    return id;
  }

  /** Overflow priority by kind; lower is dropped first. */
  const KIND_PRIORITY = {
    info: 0,
    "info-square": 0,
    success: 0,
    warning: 1,
    "warning-alt": 1,
    error: 2,
  };

  /**
   * @param {NotificationData} notification
   * @returns {number}
   */
  function priorityOf(notification) {
    // A missing kind renders as the toast's default, `error`.
    return KIND_PRIORITY[notification.kind ?? "error"] ?? 2;
  }

  /**
   * Index of the row to drop next. Top positions store the newest row first,
   * bottom positions store it last.
   * @param {Array<NotificationData>} list
   * @returns {number}
   */
  function indexToDrop(list) {
    const top = isTopPosition(position);
    const oldest = top ? list.length - 1 : 0;
    if (overflowPolicy !== "low-priority") return oldest;

    let best = oldest;
    for (let i = 0; i < list.length; i++) {
      const rank = priorityOf(list[i]);
      const bestRank = priorityOf(list[best]);
      const older = top ? i > best : i < best;
      if (rank < bestRank || (rank === bestRank && older)) best = i;
    }
    return best;
  }

  /**
   * Trim the queue to `maxNotifications` per `overflowPolicy`,
   * recording each dropped row as dismissed.
   */
  function dropOverflow() {
    if (notifications.length <= maxNotifications) return;

    const next = [...notifications];
    const dropped = [];
    while (next.length > Math.max(0, maxNotifications)) {
      dropped.push(...next.splice(indexToDrop(next), 1));
    }
    notifications = next;

    dismissRows(dropped, "overflow");
  }

  /**
   * Remove a notification by id, recording it as dismissed.
   * @param {string} id
   * @param {NotificationDismissTrigger} trigger
   * @returns {boolean}
   */
  function dismissById(id, trigger) {
    const index = notifications.findIndex((n) => n.id === id);
    if (index === -1) return false;

    const removed = notifications.splice(index, 1);
    notifications = notifications;
    dismissRows(removed, trigger);
    return true;
  }

  /**
   * @param {CustomEvent<{ timeout: boolean; trigger: "close-button" | "escape-key" | "timeout" }>} event
   * @param {string} id
   */
  function handleClose(event, id) {
    const { timeout, trigger } = event.detail;
    const shouldRemove = dispatch(
      "close",
      { id, timeout, trigger },
      { cancelable: true },
    );
    if (shouldRemove) {
      dismissById(id, trigger);
    } else {
      // Keep the toast open too; otherwise the row stays queued but hidden.
      event.preventDefault();
    }
  }

  /**
   * Update an existing notification by id, merging `patch` into it.
   * The id of the notification cannot be changed.
   * Set `restartTimeout: true` in the patch to restart the timeout from its full duration.
   * Returns true if the notification was found and updated, false otherwise.
   * @type {(id: string, patch: Partial<NotificationData> & { restartTimeout?: boolean }) => boolean}
   */
  export function update(id, patch) {
    const index = notifications.findIndex((n) => n.id === id);
    if (index === -1) return false;

    const { restartTimeout, ...rest } = patch;
    const current = notifications[index];
    const next = { ...current, ...rest, id };
    if (restartTimeout) next.timeoutKey = (current.timeoutKey ?? 0) + 1;
    notifications[index] = next;
    notifications = notifications;
    return true;
  }

  /**
   * Remove a notification by id.
   * Returns true if the notification was found and removed, false otherwise.
   * @type {(id: string) => boolean}
   */
  export function remove(id) {
    return dismissById(id, "programmatic");
  }

  /**
   * Clear all notifications. Cleared notifications are added to `history`.
   */
  export function clear() {
    const cleared = notifications;
    notifications = [];
    dismissRows(cleared, "programmatic");
  }

  /**
   * Empty `history` without changing the visible notifications.
   */
  export function clearHistory() {
    history = [];
  }
</script>

<!-- Always mounted: a live region must exist before content is added to it,
  or screen readers miss the first notification. -->
<div
  aria-live="polite"
  aria-atomic="false"
  class:bx--notification-queue={true}
  class:bx--notification-queue--top-left={position === "top-left"}
  class:bx--notification-queue--top-center={position === "top-center"}
  class:bx--notification-queue--top-right={position === "top-right"}
  class:bx--notification-queue--bottom-left={position === "bottom-left"}
  class:bx--notification-queue--bottom-center={position === "bottom-center"}
  class:bx--notification-queue--bottom-right={position === "bottom-right"}
  style:position="fixed"
  style:left={isLeftPosition(position)
    ? offsetLeft
    : isCenterPosition(position)
      ? "50%"
      : undefined}
  style:right={isRightPosition(position) ? offsetRight : undefined}
  style:top={isTopPosition(position) ? offsetTop : undefined}
  style:bottom={isTopPosition(position) ? undefined : offsetBottom}
  style:transform={isCenterPosition(position)
    ? "translateX(-50%)"
    : undefined}
  style:z-index={zIndex}
>
  {#each notifications as notification (notification.id)}
    {@const { count, ...toastProps } = notification}
    <ToastNotification
      {...toastProps}
      role={toastProps.role ?? "none"}
      title={count > 1
        ? `${toastProps.title ? `${toastProps.title} ` : ""}(${count})`
        : toastProps.title}
      on:close={(event) => handleClose(event, notification.id)}
    />
  {/each}
</div>
