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

  /** Specify the ARIA label for the icon */
  export let iconDescription = "Closes notification";

  /** Set to `true` to hide the close button */
  export let hideCloseButton = false;

  import { createEventDispatcher, onMount } from "svelte";
  import NotificationButton from "./NotificationButton.svelte";
  import NotificationIcon from "./NotificationIcon.svelte";
  import NotificationTextDetails from "./NotificationTextDetails.svelte";

  const dispatch = createEventDispatcher();

  let open = true;
  let timeoutId = undefined;

  function close(closeFromTimeout) {
    open = false;
    dispatch("close", { timeout: closeFromTimeout === true });
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
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <NotificationIcon kind="{kind}" iconDescription="{iconDescription}" />
    <NotificationTextDetails
      title="{title}"
      subtitle="{subtitle}"
      caption="{caption}"
    >
      <slot />
    </NotificationTextDetails>
    {#if !hideCloseButton}
      <NotificationButton
        iconDescription="{iconDescription}"
        on:click="{close}"
      />
    {/if}
  </div>
{/if}
