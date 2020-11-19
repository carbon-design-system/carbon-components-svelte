<script>
  /**
   * Set the type of notification
   * @type {"toast" | "inline"}
   */
  export let notificationType = "toast";

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

  /** Specify the caption text */
  export let caption = "Caption";

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
    class:bx--toast-notification="{true}"
    class:bx--toast-notification--low-contrast="{lowContrast}"
    class="{kind && `bx--toast-notification--${kind}`}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <NotificationIcon
      notificationType="{notificationType}"
      kind="{kind}"
      iconDescription="{iconDescription}"
    />
    <NotificationTextDetails
      title="{title}"
      subtitle="{subtitle}"
      caption="{caption}"
      notificationType="{notificationType}"
    >
      <slot />
    </NotificationTextDetails>
    {#if !hideCloseButton}
      <NotificationButton
        iconDescription="{iconDescription}"
        notificationType="{notificationType}"
        on:click="{close}"
      />
    {/if}
  </div>
{/if}
