import { SvelteComponentTyped } from "svelte";

export type NotificationData = {
  /** Optional id for deduplication */ id?: string;
  kind?:
    | "error"
    | "info"
    | "info-square"
    | "success"
    | "warning"
    | "warning-alt";
  title?: string;
  subtitle?: string;
  caption?: string;
  timeout?: number;
  lowContrast?: boolean;
  closeButtonDescription?: string;
  statusIconDescription?: string;
  hideCloseButton?: boolean;
};

export type NotificationQueueProps = {
  /**
   * Specify the position of the notification queue.
   * @default "top-right"
   */
  position?: "top-right" | "bottom-right";

  /**
   * Specify the top offset (CSS value)
   * @default "3rem"
   */
  offsetTop?: string;

  /**
   * Specify the bottom offset (CSS value)
   * @default "1rem"
   */
  offsetBottom?: string;

  /**
   * Specify the right offset (CSS value)
   * @default "1rem"
   */
  offsetRight?: string;

  /**
   * Specify the z-index of the notification queue.
   * By default, this matches the z-index of modals.
   * @default 9000
   */
  zIndex?: number;

  /**
   * Specify the maximum number of notifications to display.
   * When this limit is exceeded, the oldest notification is automatically removed.
   * @default 3
   */
  maxNotifications?: number;
};

export default class NotificationQueue extends SvelteComponentTyped<
  NotificationQueueProps,
  Record<string, any>,
  Record<string, never>
> {
  /**
   * Add a notification to the queue.
   * If a notification with the same id exists, the call is ignored.
   */
  add: (notification: NotificationData) => string;

  /**
   * Remove a notification by id.
   */
  remove: (id: string) => boolean;

  /**
   * Clear all notifications.
   */
  clear: () => any;
}
