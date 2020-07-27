<script>
  /**
   * Set the type of notification
   * @type {"toast" | "inline"} [notificationType="toast"]
   */
  export let notificationType = "toast";

  /**
   * Specify the kind of notification
   * @type {"error" | "info" | "info-square" | "success" | "warning" | "warning-alt"} [kind="error"]
   */
  export let kind = "error";

  /**
   * Set to `true` to use the low contrast variant
   * @type {boolean} [lowContrast=false]
   */
  export let lowContrast = false;

  /**
   * Set the timeout duration (ms) to hide the notification after closing it
   * @type {number} [timeout=0]
   */
  export let timeout = 0;

  /**
   * Set the `role` attribute
   * @type {string} [role="alert"]
   */
  export let role = "alert";

  /**
   * Specify the title text
   * @type {string} [title="Title"]
   */
  export let title = "Title";

  /**
   * Specify the subtitle text
   * @type {string} [subtitle=""]
   */
  export let subtitle = "";

  /**
   * Specify the caption text
   * @type {string} [caption="Caption"]
   */
  export let caption = "Caption";

  /**
   * Specify the ARIA label for the icon
   * @type {string} [iconDescription="Closes notification"]
   */
  export let iconDescription = "Closes notification";

  /**
   * Set to `true` to hide the close button
   * @type {boolean} [hideCloseButton=false]
   */
  export let hideCloseButton = false;

  import { createEventDispatcher, onMount } from "svelte";
  import NotificationButton from "./NotificationButton.svelte";
  import NotificationIcon from "./NotificationIcon.svelte";
  import NotificationTextDetails from "./NotificationTextDetails.svelte";

  const dispatch = createEventDispatcher();

  let open = true;
  let timeoutId = undefined;

  onMount(() => {
    if (timeout) {
      timeoutId = setTimeout(() => {
        open = false;
      }, timeout);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  });
</script>

{#if open}
  <div
    {role}
    {kind}
    class:bx--toast-notification={true}
    class:bx--toast-notification--low-contrast={lowContrast}
    class={kind && `bx--toast-notification--${kind}`}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave>
    <NotificationIcon {notificationType} {kind} {iconDescription} />
    <NotificationTextDetails {title} {subtitle} {caption} {notificationType}>
      <slot />
    </NotificationTextDetails>
    {#if !hideCloseButton}
      <NotificationButton
        {iconDescription}
        {notificationType}
        on:click={() => {
          open = false;
          dispatch('close');
        }} />
    {/if}
  </div>
{/if}
