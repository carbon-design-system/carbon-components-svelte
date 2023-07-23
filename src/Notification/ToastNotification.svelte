<script>
  /**
   * @event {{ timeout: boolean }} close
   */

  /**
   * Specify the kind of notification
   * @type {"error" | "info" | "info-square" | "success" | "warning" | "warning-alt"}
   */
  export let kind = "error";

  /** Set to `true` to use the low contrast variant */
  export let lowContrast = false;

  /** Set the timeout duration (ms) to hide the notification after opening it */
  export let timeout = 0;

  /** Set the `role` attribute */
  export let role = "alert";

  /** Specify the title text */
  export let title = "";

  /** Specify the subtitle text */
  export let subtitle = "";

  /** Specify the caption text */
  export let caption = "";

  /**
   * Specify the ARIA label for the status icon
   * @type {string}
   * */
  export let statusIconDescription = kind + " icon";

  /** Specify the ARIA label for the close button */
  export let closeButtonDescription = "Close notification";

  /** Set to `true` to hide the close button */
  export let hideCloseButton = false;

  /**
   * Set to `true` for the notification to span
   * the full width of its containing element.
   */
  export let fullWidth = false;

  import { createEventDispatcher, onMount } from "svelte";
  import NotificationButton from "./NotificationButton.svelte";
  import NotificationIcon from "./NotificationIcon.svelte";

  const dispatch = createEventDispatcher();

  let open = true;
  let timeoutId = undefined;

  function close(closeFromTimeout) {
    const shouldContinue = dispatch(
      "close",
      { timeout: closeFromTimeout === true },
      { cancelable: true }
    );
    if (shouldContinue) {
      open = false;
    }
  }

  onMount(() => {
    if (timeout) {
      timeoutId = setTimeout(() => close(true), timeout);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if open}
  <div
    role="{role}"
    kind="{kind}"
    class:bx--toast-notification="{true}"
    class:bx--toast-notification--low-contrast="{lowContrast}"
    class:bx--toast-notification--error="{kind === 'error'}"
    class:bx--toast-notification--info="{kind === 'info'}"
    class:bx--toast-notification--info-square="{kind === 'info-square'}"
    class:bx--toast-notification--success="{kind === 'success'}"
    class:bx--toast-notification--warning="{kind === 'warning'}"
    class:bx--toast-notification--warning-alt="{kind === 'warning-alt'}"
    style:width="{fullWidth ? "100%" : undefined}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <NotificationIcon kind="{kind}" iconDescription="{statusIconDescription}" />
    <div class:bx--toast-notification__details="{true}">
      <h3 class:bx--toast-notification__title="{true}">
        <slot name="title">{title}</slot>
      </h3>
      <div class:bx--toast-notification__subtitle="{true}">
        <slot name="subtitle">{subtitle}</slot>
      </div>
      <div class:bx--toast-notification__caption="{true}">
        <slot name="caption">{caption}</slot>
      </div>
      <slot />
    </div>
    {#if !hideCloseButton}
      <NotificationButton
        iconDescription="{closeButtonDescription}"
        on:click="{close}"
      />
    {/if}
  </div>
{/if}
