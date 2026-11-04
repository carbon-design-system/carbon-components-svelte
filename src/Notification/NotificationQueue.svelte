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

  /**
   * Specify the top offset (CSS value). The default clears the UI Shell
   * header, and an above-header `ShellBanner` above it.
   */
  export let offsetTop = "calc(var(--ccs-shell-offset, 0px) + 3rem)";

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

  import { onMount, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import { NOTIFICATION_QUEUE_COLLAPSE_MS } from "../constants/timing.js";
  import { focusActionableNotification } from "../utils/dismissible-notification.js";
  import { returnFocus } from "../utils/focus.js";
  import NotificationActionButton from "./NotificationActionButton.svelte";
  import ToastNotification from "./ToastNotification.svelte";

  /**
   * @typedef {NotificationData & { id: string, placeholder?: undefined }} QueuedNotification
   * @typedef {{ id?: undefined, placeholder: { height: number } }} Placeholder
   */

  /** @type {null | HTMLDivElement} */
  let queueRef = null;

  /**
   * Where F6 took focus from, so F6 inside the queue can send it back.
   * @type {null | HTMLElement}
   */
  let prevFocus = null;

  /**
   * Toasts, and the empty space of toasts that closed under the pointer.
   * Each entry renders one element, so `queueRef.children[index]` is its node.
   * @type {Array<QueuedNotification | Placeholder>}
   */
  let notifications = [];

  /**
   * Arrival order of each toast. A toast that arrives during a hold is out
   * of place until the hold ends.
   * @type {Map<string, number>}
   */
  const arrivals = new Map();

  let idCounter = 0;
  let arrivalCounter = 0;

  let hovered = false;
  let focused = false;
  let collapsing = false;

  /** @type {undefined | ReturnType<typeof setTimeout>} */
  let collapseTimer;

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

  onMount(() => () => clearTimeout(collapseTimer));

  function generateId() {
    return `notification-${idCounter++}`;
  }

  /**
   * @param {QueuedNotification | Placeholder} entry
   * @returns {entry is QueuedNotification}
   */
  function isToast(entry) {
    return !entry.placeholder;
  }

  /**
   * The props a queued notification passes to ToastNotification.
   * @param {QueuedNotification} entry
   */
  function toastProps(entry) {
    const {
      id: _id,
      action: _action,
      placeholder: _placeholder,
      ...props
    } = entry;
    return props;
  }

  /**
   * @param {QueuedNotification} entry
   * @returns {number}
   */
  function arrivalOf(entry) {
    return arrivals.get(entry.id) ?? 0;
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

    /** @type {QueuedNotification} */
    const newNotification = { ...notification, id };
    arrivals.set(id, arrivalCounter++);

    // The newest toast goes at the screen edge. While the pointer or focus
    // is in the queue, it goes at the other end instead, so the toasts
    // already there stay in place, and none drops out. It is still a live
    // region, so a screen reader announces it now.
    const held = hovered || focused;
    notifications =
      isTopPosition(position) === held
        ? [...notifications, newNotification]
        : [newNotification, ...notifications];

    if (!held) trim();
    settleFocus();

    return id;
  }

  // Drop the oldest toasts over `maxNotifications`.
  function trim() {
    const oldestFirst = notifications
      .filter(isToast)
      .sort((a, b) => arrivalOf(a) - arrivalOf(b));
    if (oldestFirst.length <= Math.max(maxNotifications, 0)) return;
    while (oldestFirst.length > Math.max(maxNotifications, 0)) {
      const [dropped] = oldestFirst.splice(dropIndex(oldestFirst, false), 1);
      arrivals.delete(dropped.id);
      notifications.splice(notifications.indexOf(dropped), 1);
    }
    notifications = notifications;
  }

  // Once the pointer and focus leave, put toasts that arrived during the
  // hold in order and drop the extras.
  function settle() {
    if (hovered || focused || collapsing) return;
    const sign = isTopPosition(position) ? -1 : 1;
    const sorted = notifications
      .filter(isToast)
      .sort((a, b) => sign * (arrivalOf(a) - arrivalOf(b)));
    if (sorted.some((entry, index) => entry !== notifications[index])) {
      notifications = sorted;
    }
    trim();
  }

  // A placeholder at the end away from the screen edge holds nothing in
  // place.
  function pruneFarEnd() {
    const top = isTopPosition(position);
    while (notifications.length > 0) {
      const index = top ? notifications.length - 1 : 0;
      if (isToast(notifications[index])) break;
      notifications.splice(index, 1);
    }
  }

  function collapse() {
    if (notifications.every(isToast)) {
      settle();
      return;
    }
    collapsing = true;
    clearTimeout(collapseTimer);
    // Not `transitionend`, which does not fire under reduced motion.
    collapseTimer = setTimeout(() => {
      collapsing = false;
      notifications = notifications.filter(isToast);
      settle();
    }, NOTIFICATION_QUEUE_COLLAPSE_MS);
  }

  /**
   * Update an existing notification by id, merging `patch` into it.
   * The id of the notification cannot be changed.
   * Returns true if the notification was found and updated, false otherwise.
   * @type {(id: string, patch: Partial<NotificationData>) => boolean}
   */
  export function update(id, patch) {
    const index = notifications.findIndex((n) => n.id === id);
    const entry = notifications[index];
    if (!entry || !isToast(entry)) return false;

    notifications[index] = { ...entry, ...patch, id };
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
    arrivals.delete(id);
    const node = queueRef?.children[index];
    if (hovered && node instanceof HTMLElement) {
      // The toasts after it would slide under the pointer, and a second
      // click would close one of them. Keep its space until the pointer
      // leaves. Focus inside it has already moved to the next toast.
      notifications[index] = { placeholder: { height: node.offsetHeight } };
    } else {
      notifications.splice(index, 1);
    }
    pruneFarEnd();
    notifications = notifications;
    settleFocus();
    return true;
  }

  /**
   * Clear all notifications.
   * @returns {void}
   */
  export function clear() {
    clearTimeout(collapseTimer);
    collapsing = false;
    arrivals.clear();
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
    // Children, so `index` also counts placeholders, which never take focus.
    const nodes = Array.from(queueRef.children);
    const current = nodes[index];
    if (!current?.contains(document.activeElement)) return;

    const nearest = [
      ...nodes.slice(index + 1),
      ...nodes.slice(0, index).reverse(),
    ];
    for (const toast of nearest) {
      if (!toast.classList.contains("bx--toast-notification")) continue;
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
      settle();
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

    // The newest toast first. During a hold it may not be at the edge.
    const newestFirst = notifications
      .flatMap((entry, index) =>
        isToast(entry) ? [{ index, arrival: arrivalOf(entry) }] : [],
      )
      .sort((a, b) => b.arrival - a.arrival);

    for (const { index } of newestFirst) {
      const toast = queueRef.children[index];
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
      if (event.pointerType === "touch") return;
      hovered = true;
      // Back in before the space collapsed: the transition reverses.
      clearTimeout(collapseTimer);
      collapsing = false;
    }}
    on:pointerleave={() => {
      hovered = false;
      collapse();
    }}
    on:focusin={() => {
      focused = true;
    }}
    on:focusout={(event) => {
      // Focus moving from one toast to another stays inside.
      const next = event.relatedTarget;
      focused = next instanceof Node && event.currentTarget.contains(next);
      settle();
    }}
  >
    <!-- `id` keys the queue; spreading it would set duplicate DOM ids across queues. -->
    {#each notifications as entry (entry.placeholder ?? entry.id)}
      {#if entry.placeholder}
        <div
          aria-hidden="true"
          class:bx--notification-queue__placeholder={true}
          style:block-size="{collapsing ? 0 : entry.placeholder.height}px"
        ></div>
      {:else}
        {@const id = entry.id}
        {@const action = entry.action}
        {@const timeout = resolveTimeout(entry)}
        {#if action}
          <ToastNotification
            {...toastProps(entry)}
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
            {...toastProps(entry)}
            {timeout}
            on:close={() => remove(id)}
          />
        {/if}
      {/if}
    {/each}
  </div>
{/if}
