<script>
  /**
   * @event close
   * @type {object}
   * @property {boolean} timeout
   * @property {"close-button" | "escape-key" | "timeout"} trigger
   */

  /**
   * Specify the kind of notification.
   * @type {"error" | "info" | "info-square" | "success" | "warning" | "warning-alt"}
   */
  export let kind = "error";

  /** Set to `true` to use the low contrast variant */
  export let lowContrast = false;

  /** Set the timeout duration (ms) to hide the notification after opening it */
  export let timeout = 0;

  /**
   * Set to `true` to show the time left before the notification closes
   * as a bar along its bottom edge. Has no effect when `timeout` is 0.
   */
  export let showTimeout = false;

  /** Set to `true` to pause the auto-dismiss timeout while the pointer is over the notification or while focus is inside it. */
  export let pauseOnHover = false;

  /**
   * Specify the ARIA `role` for the notification container.
   * When unset, `error`, `warning`, and `warning-alt` use `"alert"`;
   * `success`, `info`, and `info-square` use `"status"`.
   * Use `"none"` to render no role, for example when an ancestor is
   * already the live region that announces the notification.
   * @type {"alert" | "log" | "status" | "none" | undefined}
   */
  export let role = undefined;

  /** Specify the title text */
  export let title = "";

  /** Specify the subtitle text */
  export let subtitle = "";

  /** Specify the caption text */
  export let caption = "";

  /**
   * Specify a date to show as relative time (for example, "5 minutes ago")
   * in the caption. Formatted once when the notification renders; it does
   * not tick, so an open live region is not re-announced.
   * Ignored when `caption` or the `captionChildren` slot is set.
   * @type {Date | number | string | undefined}
   */
  export let captionDate = undefined;

  /** Specify the ARIA label for the close button */
  export let closeButtonDescription = "Close notification";

  /** Set to `true` to hide the close button */
  export let hideCloseButton = false;

  /**
   * Set to `true` for the notification to span
   * the full width of its containing element.
   */
  export let fullWidth = false;

  /**
   * Change this value to restart the timeout from its full duration,
   * for example after updating the message.
   * @type {number}
   */
  export let timeoutKey = 0;

  /**
   * Set to `true` to show the notification, `false` to hide it.
   * @bindable writable
   */
  export let open = true;

  import { createEventDispatcher, onMount } from "svelte";
  import RelativeTime from "../RelativeTime/RelativeTime.svelte";
  import { createHoverFocusPause } from "../utils/pause-on-hover-focus.js";
  import { createTimeoutDismiss } from "../utils/timeout-dismiss.js";
  import NotificationButton from "./NotificationButton.svelte";
  import NotificationIcon from "./NotificationIcon.svelte";

  const dispatch = createEventDispatcher();

  const dismiss = createTimeoutDismiss(() => syncTimeoutBar());

  const { handleMouseenter, handleMouseleave, handleFocusIn, handleFocusOut } =
    createHoverFocusPause(dismiss, () => pauseOnHover);

  /** @param {"close-button" | "escape-key" | "timeout"} trigger */
  function close(trigger) {
    dismiss.clear();

    const shouldContinue = dispatch(
      "close",
      { timeout: trigger === "timeout", trigger },
      { cancelable: true },
    );
    if (shouldContinue) {
      open = false;
    }
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.key !== "Escape" || hideCloseButton) return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(
        "input, textarea, select, [contenteditable]:not([contenteditable='false'])",
      )
    ) {
      return;
    }
    // Stop an enclosing Modal from also closing on the same Escape.
    event.preventDefault();
    event.stopPropagation();
    close("escape-key");
  }

  $: resolvedRole =
    role ??
    (kind === "error" || kind === "warning" || kind === "warning-alt"
      ? "alert"
      : "status");

  // Reading `timeoutKey` makes a change to it re-run `sync`, which
  // restarts the timer from the full `timeout`.
  $: {
    timeoutKey;
    dismiss.sync(open, timeout, () => close("timeout"));
  }

  /** @type {HTMLDivElement | null} */
  let timeoutBar = null;

  /**
   * Draw the timeout bar from the timer's state. Runs only when the timer
   * starts, pauses, resumes, or stops: the bar jumps to the time left, then
   * a CSS transition shrinks it to 0 over that time, off the main thread.
   */
  function syncTimeoutBar() {
    const bar = timeoutBar;
    if (!bar || timeout <= 0) return;
    const remaining = dismiss.remainingMs();
    bar.style.transitionDuration = "0ms";
    bar.style.transform = `scaleX(${remaining / timeout})`;
    if (!dismiss.running) return;
    // Commit the jump so the change below transitions from it.
    bar.getBoundingClientRect();
    bar.style.transitionDuration = `${remaining}ms`;
    bar.style.transform = "scaleX(0)";
  }

  /** @param {HTMLDivElement} node */
  function timeoutBarAction(node) {
    timeoutBar = node;
    syncTimeoutBar();
    return {
      destroy() {
        timeoutBar = null;
      },
    };
  }

  $: showTimeoutBar = showTimeout && open && timeout > 0;

  onMount(() => () => dismiss.clear());
</script>

{#if open}
  <div
    role={resolvedRole === "none" ? undefined : resolvedRole}
    class:bx--toast-notification={true}
    class:bx--toast-notification--low-contrast={lowContrast}
    class:bx--toast-notification--timeout={showTimeoutBar}
    class:bx--toast-notification--error={kind === "error"}
    class:bx--toast-notification--info={kind === "info"}
    class:bx--toast-notification--info-square={kind === "info-square"}
    class:bx--toast-notification--success={kind === "success"}
    class:bx--toast-notification--warning={kind === "warning"}
    class:bx--toast-notification--warning-alt={kind === "warning-alt"}
    style:width={fullWidth ? "100%" : undefined}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseenter={handleMouseenter}
    on:mouseleave
    on:mouseleave={handleMouseleave}
    on:focusin={handleFocusIn}
    on:focusout={handleFocusOut}
    on:keydown={handleKeydown}
  >
    <NotificationIcon {kind} />
    <div class:bx--toast-notification__details={true}>
      <h3 class:bx--toast-notification__title={true}>
        <slot name="titleChildren">{title}</slot>
      </h3>
      {#if subtitle || $$slots.subtitleChildren}
        <div class:bx--toast-notification__subtitle={true}>
          <slot name="subtitleChildren">{subtitle}</slot>
        </div>
      {/if}
      {#if caption || $$slots.captionChildren}
        <div class:bx--toast-notification__caption={true}>
          <slot name="captionChildren">{caption}</slot>
        </div>
      {:else if captionDate != null}
        <div class:bx--toast-notification__caption={true}>
          <RelativeTime date={captionDate} live={false} />
        </div>
      {/if}
      <slot />
    </div>
    {#if !hideCloseButton}
      <NotificationButton
        iconDescription={closeButtonDescription}
        on:click={() => close("close-button")}
      />
    {/if}
    {#if showTimeoutBar}
      <div
        aria-hidden="true"
        class:bx--toast-notification__timeout={true}
        use:timeoutBarAction
      ></div>
    {/if}
  </div>
{/if}
