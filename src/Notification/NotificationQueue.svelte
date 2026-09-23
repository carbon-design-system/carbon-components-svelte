<script>
  /**
   * @typedef {object} NotificationData
   * @property {string} [id] - Optional id for deduplication
   * @property {"error" | "info" | "info-square" | "success" | "warning" | "warning-alt"} [kind]
   * @property {string} [title]
   * @property {string} [subtitle]
   * @property {string} [caption]
   * @property {number} [timeout]
   * @property {boolean} [lowContrast]
   * @property {string} [closeButtonDescription]
   * @property {boolean} [hideCloseButton]
   * @property {boolean} [pauseOnHover]
   * @property {"alert" | "log" | "status"} [role]
   * @property {boolean} [fullWidth]
   */

  /**
   * @typedef {"close-button" | "timeout" | "overflow" | "programmatic"} NotificationDismissTrigger
   */

  /**
   * @event close
   * @type {object}
   * @property {string} id
   * @property {boolean} timeout
   * @property {"close-button" | "timeout"} trigger
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
   * When this limit is exceeded, the oldest notification is automatically removed.
   */
  export let maxNotifications = 3;

  import { createEventDispatcher } from "svelte";
  import ToastNotification from "./ToastNotification.svelte";

  const dispatch = createEventDispatcher();

  /** @type {Array<NotificationData & { id: string; timeoutKey?: number }>} */
  let notifications = [];

  let idCounter = 0;

  function generateId() {
    return `notification-${idCounter++}`;
  }

  /**
   * A stored row without the queue's bookkeeping fields.
   * @param {NotificationData & { id: string; timeoutKey?: number }} row
   * @returns {NotificationData & { id: string }}
   */
  function toNotificationData({ timeoutKey, ...notification }) {
    return notification;
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
   * Returns the notification id (either the provided id or a generated one).
   * @type {(notification: NotificationData) => string}
   */
  export function add(notification) {
    const id = notification.id ?? generateId();

    if (notifications.some((n) => n.id === id)) {
      return id;
    }

    /** @type {NotificationData & { id: string }} */
    const newNotification = { ...notification, id };

    notifications = isTopPosition(position)
      ? [newNotification, ...notifications]
      : [...notifications, newNotification];
    dropOverflow();

    return id;
  }

  /**
   * Trim the queue to `maxNotifications`, dropping the oldest rows,
   * and dispatch `dismiss` for each dropped row.
   */
  function dropOverflow() {
    if (notifications.length <= maxNotifications) return;

    const top = isTopPosition(position);
    const excess = notifications.length - maxNotifications;
    const dropped = top
      ? notifications.slice(maxNotifications)
      : notifications.slice(0, excess);
    notifications = top
      ? notifications.slice(0, maxNotifications)
      : notifications.slice(excess);

    for (const notification of dropped) {
      dispatch("dismiss", {
        notification: toNotificationData(notification),
        trigger: "overflow",
      });
    }
  }

  /**
   * Remove a notification by id and dispatch `dismiss`.
   * @param {string} id
   * @param {NotificationDismissTrigger} trigger
   * @returns {boolean}
   */
  function dismissById(id, trigger) {
    const index = notifications.findIndex((n) => n.id === id);
    if (index === -1) return false;

    const [notification] = notifications.splice(index, 1);
    notifications = notifications;
    dispatch("dismiss", {
      notification: toNotificationData(notification),
      trigger,
    });
    return true;
  }

  /**
   * @param {CustomEvent<{ timeout: boolean }>} event
   * @param {string} id
   */
  function handleClose(event, id) {
    const timeout = event.detail?.timeout === true;
    const trigger = timeout ? "timeout" : "close-button";
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
   * Clear all notifications.
   */
  export function clear() {
    const cleared = notifications;
    notifications = [];
    for (const notification of cleared) {
      dispatch("dismiss", {
        notification: toNotificationData(notification),
        trigger: "programmatic",
      });
    }
  }
</script>

{#if notifications.length > 0}
  <div
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
      <ToastNotification
        {...notification}
        on:close={(event) => handleClose(event, notification.id)}
      />
    {/each}
  </div>
{/if}
