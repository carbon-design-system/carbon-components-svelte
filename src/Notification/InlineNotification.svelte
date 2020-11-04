<script>
  /**
   * Set the type of notification
   * @type {"toast" | "inline"}
   */
  export let notificationType = "inline";

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
  export let title = "Title";

  /** Specify the subtitle text */
  export let subtitle = "";

  /** Set to `true` to hide the close button */
  export let hideCloseButton = false;

  /** Specify the ARIA label for the icon */
  export let iconDescription = "Closes notification";

  import { createEventDispatcher, onMount } from "svelte";
  import NotificationIcon from "./NotificationIcon.svelte";
  import NotificationTextDetails from "./NotificationTextDetails.svelte";
  import NotificationButton from "./NotificationButton.svelte";

  const dispatch = createEventDispatcher();

  let open = true;
  let timeoutId = undefined;

  function close() {
    open = false;
    dispatch("close");
  }

  onMount(() => {
    if (timeout) {
      timeoutId = setTimeout(() => close(), timeout);
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
    class:bx--inline-notification="{true}"
    class:bx--inline-notification--low-contrast="{lowContrast}"
    class:bx--inline-notification--hide-close-button="{hideCloseButton}"
    class="{kind && `bx--inline-notification--${kind}`}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <div class:bx--inline-notification__details="{true}">
      <NotificationIcon
        notificationType="{notificationType}"
        kind="{kind}"
        iconDescription="{iconDescription}"
      />
      <NotificationTextDetails
        title="{title}"
        subtitle="{subtitle}"
        notificationType="{notificationType}"
      >
        <slot />
      </NotificationTextDetails>
    </div>
    <slot name="actions" />
    {#if !hideCloseButton}
      <NotificationButton
        iconDescription="{iconDescription}"
        notificationType="{notificationType}"
        on:click="{close}"
      />
    {/if}
  </div>
{/if}
