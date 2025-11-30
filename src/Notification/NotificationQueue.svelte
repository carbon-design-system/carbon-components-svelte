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
   * @property {string} [statusIconDescription]
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

  const generateId = () => `notification-${idCounter++}`;

  /**
   * Add a notification to the queue.
   * If a notification with the same id exists, the call is ignored.
   * @param {NotificationData} notification
   * @returns {string} The notification id
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
   * Remove a notification by id.
   * @param {string} id
   * @returns {boolean} True if the notification was found and removed
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
