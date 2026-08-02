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
   */

  /**
   * Specify the position of the notification queue.
   * @type {"top-right" | "bottom-right"}
   */
  export let position = "top-right";

  /** Specify the top offset (CSS value) */
  export let offsetTop = "3rem";

  /** Specify the bottom offset (CSS value) */
  export let offsetBottom = "1rem";

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

  import ToastNotification from "./ToastNotification.svelte";

  /** @type {Array<NotificationData & { id: string }>} */
  let notifications = [];

  let idCounter = 0;

  function generateId() {
    return `notification-${idCounter++}`;
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

    if (position === "top-right") {
      notifications = [newNotification, ...notifications];
      if (notifications.length > maxNotifications) {
        notifications.splice(maxNotifications);
      }
    } else {
      notifications = [...notifications, newNotification];
      if (notifications.length > maxNotifications) {
        notifications.splice(0, notifications.length - maxNotifications);
      }
    }
    notifications = notifications;

    return id;
  }

  /**
   * Update an existing notification by id, merging `patch` into it.
   * The id of the notification cannot be changed.
   * Returns true if the notification was found and updated, false otherwise.
   * @type {(id: string, patch: Partial<NotificationData>) => boolean}
   */
  export function update(id, patch) {
    const index = notifications.findIndex((n) => n.id === id);
    if (index === -1) return false;

    notifications[index] = { ...notifications[index], ...patch, id };
    notifications = notifications;
    return true;
  }

  /**
   * Remove a notification by id.
   * Returns true if the notification was found and removed, false otherwise.
   * @type {(id: string) => boolean}
   */
  export function remove(id) {
    const index = notifications.findIndex((n) => n.id === id);
    if (index === -1) return false;

    notifications.splice(index, 1);
    notifications = notifications;
    return true;
  }

  /**
   * Clear all notifications.
   */
  export function clear() {
    notifications = [];
  }

  const DEFAULT_SETTLE_TIMEOUT = 3000;

  /**
   * @param {string | NotificationData} msg
   * @param {NotificationData["kind"]} kind
   * @param {Partial<NotificationData>} [defaults]
   * @returns {NotificationData}
   */
  function toNotificationData(msg, kind, defaults = {}) {
    if (typeof msg === "string") {
      return { ...defaults, kind, title: msg, subtitle: "", caption: "" };
    }
    return { ...defaults, kind, ...msg };
  }

  /**
   * Show a loading notification for a promise, then update it to success or
   * error when the promise settles. Returns the original promise result.
   * String messages become the notification title. Success and error toasts
   * default to a 3000ms timeout unless overridden in a `NotificationData` object.
   * @type {<T>(p: Promise<T>, msgs: { loading: string | NotificationData; success: string | ((value: T) => string | NotificationData); error: string | ((err: unknown) => string | NotificationData) }) => Promise<T>}
   */
  export function promise(p, msgs) {
    const id = add(
      toNotificationData(msgs.loading, "info", { hideCloseButton: true }),
    );

    return p.then(
      (value) => {
        const successMsg =
          typeof msgs.success === "function"
            ? msgs.success(value)
            : msgs.success;
        update(
          id,
          toNotificationData(successMsg, "success", {
            hideCloseButton: false,
            timeout: DEFAULT_SETTLE_TIMEOUT,
          }),
        );
        return value;
      },
      (err) => {
        const errorMsg =
          typeof msgs.error === "function" ? msgs.error(err) : msgs.error;
        update(
          id,
          toNotificationData(errorMsg, "error", {
            hideCloseButton: false,
            timeout: DEFAULT_SETTLE_TIMEOUT,
          }),
        );
        throw err;
      },
    );
  }
</script>

{#if notifications.length > 0}
  <div
    style:position="fixed"
    style:right={offsetRight}
    style:top={position === "top-right" ? offsetTop : undefined}
    style:bottom={position === "bottom-right" ? offsetBottom : undefined}
    style:z-index={zIndex}
  >
    {#each notifications as notification (notification.id)}
      <ToastNotification
        {...notification}
        on:close={() => remove(notification.id)}
      />
    {/each}
  </div>
{/if}
