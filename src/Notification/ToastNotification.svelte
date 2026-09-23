<script>
  /**
   * @event close
   * @property {boolean} timeout
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

  /** Set to `true` to pause the auto-dismiss timeout while the pointer is over the notification or while focus is inside it. */
  export let pauseOnHover = false;

  /**
   * Specify the ARIA `role` for the notification container.
   * When unset, `error`, `warning`, and `warning-alt` use `"alert"`;
   * `success`, `info`, and `info-square` use `"status"`.
   * @type {"alert" | "log" | "status" | undefined}
   */
  export let role = undefined;

  /** Specify the title text */
  export let title = "";

  /** Specify the subtitle text */
  export let subtitle = "";

  /** Specify the caption text */
  export let caption = "";

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
   * Set to `true` to show the notification, `false` to hide it.
   * @bindable writable
   */
  export let open = true;

  import { createEventDispatcher, onMount } from "svelte";
  import { createHoverFocusPause } from "../utils/pause-on-hover-focus.js";
  import { createTimeoutDismiss } from "../utils/timeout-dismiss.js";
  import NotificationButton from "./NotificationButton.svelte";
  import NotificationIcon from "./NotificationIcon.svelte";

  const dispatch = createEventDispatcher();

  const dismiss = createTimeoutDismiss();

  const { handleMouseenter, handleMouseleave, handleFocusIn, handleFocusOut } =
    createHoverFocusPause(dismiss, () => pauseOnHover);

  function close(closeFromTimeout) {
    dismiss.clear();

    const shouldContinue = dispatch(
      "close",
      { timeout: closeFromTimeout === true },
      { cancelable: true },
    );
    if (shouldContinue) {
      open = false;
    }
  }

  $: resolvedRole =
    role ??
    (kind === "error" || kind === "warning" || kind === "warning-alt"
      ? "alert"
      : "status");

  $: dismiss.sync(open, timeout, () => close(true));

  onMount(() => () => dismiss.clear());
</script>

{#if open}
  <div
    role={resolvedRole}
    class:bx--toast-notification={true}
    class:bx--toast-notification--low-contrast={lowContrast}
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
      {/if}
      <slot />
    </div>
    {#if !hideCloseButton}
      <NotificationButton
        iconDescription={closeButtonDescription}
        on:click={close}
      />
    {/if}
  </div>
{/if}
