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
  function resolveTimeout({ action, actionable, timeout }, undoable = false) {
    return persists({ action, actionable }, undoable) ? 0 : (timeout ?? 0);
  }

  /**
   * An `undoable` toast holds an action but times out, since its commit
   * waits on the timer. It is the one exception to the rule above.
   * @param {{ action?: unknown, actionable?: boolean }} notification
   * @param {boolean} [undoable]
   * @returns {boolean}
   */
  function persists({ action, actionable }, undoable = false) {
    return (!!action && !undoable) || !!actionable;
  }

  /**
   * The toast to drop when the queue is full: the oldest one that does not
   * persist, so a new toast does not push out an action the user has not
   * reached. The newest toast always shows.
   * @template {{ action?: unknown, actionable?: boolean }} Row
   * @param {Row[]} list
   * @param {boolean} top - Newest first, as in top positions
   * @param {(row: Row) => boolean} [holds] - Whether a row persists
   * @returns {number}
   */
  function dropIndex(list, top, holds = persists) {
    const oldestFirst = list.map((_, index) => index);
    if (top) oldestFirst.reverse();
    const older = oldestFirst.slice(0, -1);
    return older.find((index) => !holds(list[index])) ?? oldestFirst[0];
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
   * @property {boolean} [loading] - Show a spinner in place of the status icon, as `promise()` does while it waits
   */

  /**
   * @typedef {string | NotificationData} NotificationMessage - A string is the title
   */

  /**
   * @typedef {NotificationData & {
   *   commit: () => unknown,
   *   undo?: () => void,
   *   actionText?: string,
   *   timeout?: number,
   * }} UndoableData
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

  import { onMount, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import { focusActionableNotification } from "../utils/dismissible-notification.js";
  import { addPooledListener } from "../utils/window-listener-pool.js";
  import NotificationActionButton from "./NotificationActionButton.svelte";
  import NotificationQueueIcon from "./NotificationQueueIcon.svelte";
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

  /**
   * An undoable toast waits on its timer: `commit` runs when the toast
   * leaves the list for any reason but Undo. Kept per queue, never at
   * module scope, so server renders do not share it.
   * @type {Map<string, () => void>}
   */
  const pending = new Map();

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
      const [dropped] = notifications.splice(
        dropIndex(notifications, top, holds),
        1,
      );
      settle(dropped.id);
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

    notifications.splice(index, 1);
    notifications = notifications;
    settle(id);
    settleFocus();
    return true;
  }

  /**
   * Clear all notifications. An undoable notification commits.
   * @returns {void}
   */
  export function clear() {
    const cleared = notifications;
    notifications = [];
    for (const { id } of cleared) settle(id);
  }

  /**
   * Show a loading toast while `promise` is pending, then update it in
   * place to the success or error message. Returns `promise` itself, so
   * `await queue.promise(save(), ...)` still rejects on failure.
   *
   * A string message is the title. The loading toast does not time out,
   * and closing it hides the outcome. The success toast times out after 5 seconds,
   * and the error toast stays until it is closed, unless the message sets
   * its own `timeout`. If the loading toast has gone by the time the
   * promise fails, the error shows as a new toast. A success is dropped.
   * @type {<T>(
   *   task: Promise<T>,
   *   messages: {
   *     loading: NotificationMessage,
   *     success?: NotificationMessage | ((value: T) => NotificationMessage),
   *     error?: NotificationMessage | ((reason: unknown) => NotificationMessage),
   *   },
   * ) => Promise<T>}
   */
  export function promise(task, messages) {
    const id = add({
      kind: "info",
      timeout: 0,
      ...asData(messages.loading),
      loading: true,
    });

    /**
     * @param {NotificationData} defaults
     * @param {NotificationMessage | undefined} message
     */
    function settleWith(defaults, message) {
      if (message === undefined) {
        remove(id);
        return;
      }
      const patch = {
        loading: false,
        ...defaults,
        ...asData(message),
      };
      if (!update(id, patch) && patch.kind === "error") {
        add({ ...patch, id: undefined });
      }
    }

    task.then(
      (value) => {
        const { success } = messages;
        settleWith(
          { kind: "success", timeout: 5000 },
          typeof success === "function" ? success(value) : success,
        );
      },
      (reason) => {
        const { error } = messages;
        settleWith(
          { kind: "error", timeout: 0 },
          typeof error === "function" ? error(reason) : error,
        );
      },
    );

    return task;
  }

  /**
   * Show a toast with an Undo action, and run `commit` only once the toast
   * leaves without Undo: its timeout (10 seconds by default), its close
   * button, overflow, `clear()`, `remove()`, the queue unmounting, or the
   * page hiding. Resolves `true` when `commit` ran, `false` when the user
   * chose Undo, and rejects with what `commit` throws or rejects with.
   *
   * It is the one toast with an action that times out, so the commit does
   * not wait on a decision nobody makes. The timer pauses while the
   * pointer or focus is in the queue, and F6 reaches the action.
   * Pass `timeout: 0` for a toast that commits only when it is closed.
   * @type {(data: UndoableData) => Promise<boolean>}
   */
  export function undoable({
    commit,
    undo,
    actionText = "Undo",
    timeout = 10000,
    ...data
  }) {
    return new Promise((resolve, reject) => {
      const id = data.id ?? generateId();
      // Replacing a toast with the same id commits the one it replaces.
      remove(id);
      pending.set(id, () => {
        try {
          Promise.resolve(commit()).then(() => resolve(true), reject);
        } catch (error) {
          reject(error);
        }
      });
      add({
        kind: "info",
        ...data,
        id,
        timeout,
        action: {
          label: actionText,
          onClick() {
            pending.delete(id);
            resolve(false);
            undo?.();
          },
        },
      });
    });
  }

  /**
   * @param {NotificationMessage} message
   * @returns {NotificationData}
   */
  function asData(message) {
    return typeof message === "string" ? { title: message } : message;
  }

  /**
   * Run the commit of an undoable toast that has left the list.
   * @param {string} id
   */
  function settle(id) {
    const commit = pending.get(id);
    if (!commit) return;
    pending.delete(id);
    commit();
  }

  function settleAll() {
    for (const id of [...pending.keys()]) settle(id);
  }

  /** @param {NotificationData & { id: string }} row */
  function holds(row) {
    return persists(row, pending.has(row.id));
  }

  /** @type {import("./notification-queue-context.js").NotificationQueueApi} */
  const queue = { add, update, remove, clear, promise, undoable };

  setContext("carbon:NotificationQueue", { paused, queue });

  // A commit must not depend on a toast's exit animation: when an ancestor
  // tears down, `|local` outros never run. Destroying the queue and
  // `pagehide` commit directly.
  onMount(() => {
    const stop = addPooledListener("pagehide", settleAll);
    return () => {
      stop();
      settleAll();
    };
  });

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
    {#each notifications as { id, action, loading, ...notification } (id)}
      {@const held = pending.has(id)}
      {@const timeout = resolveTimeout({ action, ...notification }, held)}
      {#if action && !held}
        <ToastNotification
          {...notification}
          {timeout}
          on:close={() => remove(id)}
        >
          <svelte:fragment slot="icon">
            <NotificationQueueIcon
              {loading}
              kind={notification.kind}
              lowContrast={notification.lowContrast}
              statusIconDescription={notification.statusIconDescription}
            />
          </svelte:fragment>
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
        >
          <svelte:fragment slot="icon">
            <NotificationQueueIcon
              {loading}
              kind={notification.kind}
              lowContrast={notification.lowContrast}
              statusIconDescription={notification.statusIconDescription}
            />
          </svelte:fragment>
          {#if action}
            <!-- An undoable toast times out, and a toast times out only when it has no `actions` slot. The wrapper is the one that slot renders. -->
            <div class:bx--toast-notification__actions={true}>
              <NotificationActionButton
                href={action.href}
                on:click={(event) => handleAction(id, action, event)}
              >
                {action.label}
              </NotificationActionButton>
            </div>
          {/if}
        </ToastNotification>
      {/if}
    {/each}
  </div>
{/if}

<slot />
