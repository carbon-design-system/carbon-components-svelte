// @ts-check
import { getContext } from "svelte";

/**
 * Get the API of the nearest `NotificationQueue` above the calling
 * component, so a deep descendant can add a toast without a `bind:this`
 * reference passed down to it. Call it while the component initializes.
 * Throws when no `NotificationQueue` wraps the component.
 *
 * The queue reaches descendants through Svelte context, not a module
 * store, so each server render and each queue keeps its own state.
 *
 * @example
 * ```svelte
 * <script>
 *   import { getNotificationQueue } from "carbon-components-svelte";
 *
 *   const queue = getNotificationQueue();
 * </script>
 *
 * <button on:click={() => queue.add({ kind: "success", title: "Saved" })}>
 *   Save
 * </button>
 * ```
 */
export function getNotificationQueue() {
  /** @type {{ queue?: unknown } | undefined} */
  const context = getContext("carbon:NotificationQueue");
  if (!context?.queue) {
    throw new Error(
      "getNotificationQueue() must be called inside a NotificationQueue.",
    );
  }
  return /** @type {import("./notification-queue-context.js").NotificationQueueApi} */ (
    context.queue
  );
}
