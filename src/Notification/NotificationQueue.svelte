<script context="module">
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
   * A toast that holds an action, or that is an `alertdialog`, persists
   * until the user acts on it or closes it, as in Carbon's usage guidance
   * and React Spectrum's toast queue. A timer could remove it before a
   * keyboard or screen reader user reaches it (WCAG 2.2.1).
   * @param {{ action?: unknown, actionable?: boolean, timeout?: number }} notification
   * @returns {number}
   */
  function resolveTimeout({ action, actionable, timeout }) {
    return persists({ action, actionable }) ? 0 : (timeout ?? 0);
  }

  /**
   * @param {{ action?: unknown, actionable?: boolean }} notification
   * @returns {boolean}
   */
  function persists({ action, actionable }) {
    return !!action || !!actionable;
  }

  /**
   * The toast to drop when the queue is full: the oldest one that does not
   * persist, so a new toast does not push out an action the user has not
   * reached. The newest toast always shows.
   * @param {Array<{ action?: unknown, actionable?: boolean }>} list
   * @param {boolean} top - Newest first, as in top positions
   * @returns {number}
   */
  function dropIndex(list, top) {
    const oldestFirst = list.map((_, index) => index);
    if (top) oldestFirst.reverse();
    const older = oldestFirst.slice(0, -1);
    return older.find((index) => !persists(list[index])) ?? oldestFirst[0];
  }
</script>

<script>
  /**
   * @typedef {object} NotificationAction
   * @property {string} label - The action button text
   * @property {(event: MouseEvent) => void} [onClick] - Called when the action is clicked. The toast then closes, unless the handler calls `event.preventDefault()`.
   * @property {string} [href] - Render the action as a link
   */

  /**
   * @typedef {object} NotificationData
   * @property {string} [id] - Optional id for deduplication
   * @property {"error" | "info" | "info-square" | "success" | "warning" | "warning-alt"} [kind]
   * @property {string} [title]
   * @property {string} [subtitle]
   * @property {string} [caption]
   * @property {number} [timeout] - Ignored when the notification has an `action` or is `actionable`
   * @property {boolean} [lowContrast]
   * @property {string} [closeButtonDescription]
   * @property {string} [statusIconDescription]
   * @property {boolean} [hideCloseButton]
   * @property {boolean} [pauseOnHover]
   * @property {"alert" | "log" | "status"} [role]
   * @property {boolean} [fullWidth]
   * @property {boolean} [actionable] - Render as an `alertdialog` that takes focus and closes on Escape
   * @property {boolean} [focusOnOpen]
   * @property {boolean} [closeOnEscape]
   * @property {NotificationAction} [action] - Add an action button. The toast keeps focus where it is and does not time out.
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
   * Notifications without an `action` or `actionable` go first.
   */
  export let maxNotifications = 3;

  /** Specify the accessible name of the notifications landmark */
  export let labelText = "Notifications";

  import { setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import { focusActionableNotification } from "../utils/dismissible-notification.js";
  import { returnFocus } from "../utils/focus.js";
  import NotificationActionButton from "./NotificationActionButton.svelte";
  import ToastNotification from "./ToastNotification.svelte";

  /** @type {null | HTMLDivElement} */
  let queueRef = null;

  /**
   * Where F6 took focus from, so F6 inside the queue can send it back.
   * @type {null | HTMLElement}
   */
  let prevFocus = null;

  /** @type {Array<NotificationData & { id: string }>} */
  let notifications = [];

  let idCounter = 0;

  let hovered = false;
  let focused = false;

  // As in React Aria's toast region, every toast's timer pauses while the
  // pointer or focus is in the queue, then resumes with the time it had left.
  const paused = writable(false);

  setContext("carbon:NotificationQueue", { paused });

  // The queue unmounts when it empties, which fires no leave events.
  $: if (notifications.length === 0) {
    hovered = false;
    focused = false;
  }
  $: paused.set(hovered || focused);

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

    const top = isTopPosition(position);
    notifications = top
      ? [newNotification, ...notifications]
      : [...notifications, newNotification];

    while (notifications.length > Math.max(maxNotifications, 0)) {
      notifications.splice(dropIndex(notifications, top), 1);
    }
    notifications = notifications;
    settleFocus();

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

    moveFocusFrom(index);
    notifications.splice(index, 1);
    notifications = notifications;
    settleFocus();
    return true;
  }

  /**
   * Clear all notifications.
   * @returns {void}
   */
  export function clear() {
    notifications = [];
  }

  /**
   * When the toast at `index` holds focus, move it to the next toast in
   * visual order, else the previous one, else back to where F6 took it
   * from. The toast's own focus return then finds focus taken and stays
   * put, so the user keeps their place in the queue.
   * @param {number} index
   */
  function moveFocusFrom(index) {
    if (!queueRef) return;
    const toasts = Array.from(
      queueRef.querySelectorAll(".bx--toast-notification"),
    );
    const current = toasts[index];
    if (!current?.contains(document.activeElement)) return;

    const nearest = [
      ...toasts.slice(index + 1),
      ...toasts.slice(0, index).reverse(),
    ];
    for (const toast of nearest) {
      if (toast instanceof HTMLElement) focusActionableNotification(toast);
      if (!current.contains(document.activeElement)) return;
    }

    returnFocus(prevFocus, current);
    prevFocus = null;
  }

  // Firefox and Safari fire no `focusout` when they remove the focused toast.
  function settleFocus() {
    if (!focused) return;
    tick().then(() => {
      focused = !!queueRef?.contains(document.activeElement);
    });
  }

  /**
   * @param {string} id
   * @param {NotificationAction} action
   * @param {MouseEvent} event
   */
  function handleAction(id, action, event) {
    action.onClick?.(event);
    if (!event.defaultPrevented) remove(id);
  }

  /**
   * F6 and Shift+F6 move focus into the queue and back, as with React
   * Aria's toast region, so a toast's action is reachable without
   * stealing focus when it opens.
   * @param {KeyboardEvent} event
   */
  function handleWindowKeydown(event) {
    if (event.key !== "F6" || event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!queueRef) return;

    const active = document.activeElement;

    if (queueRef.contains(active)) {
      if (!prevFocus?.isConnected) return;
      event.preventDefault();
      prevFocus.focus();
      prevFocus = null;
      return;
    }

    const toasts = Array.from(
      queueRef.querySelectorAll(".bx--toast-notification"),
    );
    // The newest toast first: `add` puts it nearest the screen edge.
    if (!isTopPosition(position)) toasts.reverse();

    for (const toast of toasts) {
      if (!(toast instanceof HTMLElement)) continue;
      focusActionableNotification(toast);
      if (queueRef.contains(document.activeElement)) {
        event.preventDefault();
        prevFocus =
          active instanceof HTMLElement && active !== document.body
            ? active
            : null;
        return;
      }
    }
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

{#if notifications.length > 0}
  <div
    bind:this={queueRef}
    role="region"
    aria-label={labelText}
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
    on:pointerenter={(event) => {
      // Touch has no hover. A tap would leave the queue paused.
      if (event.pointerType !== "touch") hovered = true;
    }}
    on:pointerleave={() => {
      hovered = false;
    }}
    on:focusin={() => {
      focused = true;
    }}
    on:focusout={(event) => {
      // Focus moving from one toast to another stays inside.
      const next = event.relatedTarget;
      focused = next instanceof Node && event.currentTarget.contains(next);
    }}
  >
    <!-- `id` keys the queue; spreading it would set duplicate DOM ids across queues. -->
    {#each notifications as { id, action, ...notification } (id)}
      {@const timeout = resolveTimeout({ action, ...notification })}
      {#if action}
        <ToastNotification
          {...notification}
          {timeout}
          on:close={() => remove(id)}
        >
          <svelte:fragment slot="actions">
            <NotificationActionButton
              href={action.href}
              on:click={(event) => handleAction(id, action, event)}
            >
              {action.label}
            </NotificationActionButton>
          </svelte:fragment>
        </ToastNotification>
      {:else}
        <ToastNotification
          {...notification}
          {timeout}
          on:close={() => remove(id)}
        />
      {/if}
    {/each}
  </div>
{/if}
