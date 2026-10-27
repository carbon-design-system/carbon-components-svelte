import type {
  NotificationData,
  NotificationMessage,
  UndoableData,
} from "./NotificationQueue.svelte";

/** The methods of a `NotificationQueue`, as `bind:this` exposes them. */
export interface NotificationQueueApi {
  add: (notification: NotificationData) => string;
  update: (id: string, patch: Partial<NotificationData>) => boolean;
  remove: (id: string) => boolean;
  clear: () => void;
  promise: <T>(
    task: Promise<T>,
    messages: {
      loading: NotificationMessage;
      success?: NotificationMessage | ((value: T) => NotificationMessage);
      error?: NotificationMessage | ((reason: unknown) => NotificationMessage);
    },
  ) => Promise<T>;
  undoable: (data: UndoableData) => Promise<boolean>;
}

/**
 * Get the API of the nearest `NotificationQueue` above the calling
 * component. Call it while the component initializes. Throws when no
 * `NotificationQueue` wraps the component.
 */
export function getNotificationQueue(): NotificationQueueApi;
