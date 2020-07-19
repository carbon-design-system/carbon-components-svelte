<script>
  export let iconDescription = "closes notification";
  export let notificationType = "toast"; // "toast" | "inline"
  export let kind = "error";
  export let hideCloseButton = false;
  export let lowContrast = false;
  export let timeout = 0;
  export let role = "alert";
  export let title = "provide a title";
  export let subtitle = "";
  export let caption = "provide a caption";

  import { createEventDispatcher, onMount } from "svelte";
  import NotificationButton from "./NotificationButton.svelte";
  import NotificationIcon from "./NotificationIcon.svelte";
  import NotificationTextDetails from "./NotificationTextDetails.svelte";

  const dispatch = createEventDispatcher();

  $: open = true;
  $: timeoutId = undefined;

  onMount(() => {
    if (timeout) {
      timeoutId = window.setTimeout(() => {
        open = false;
      }, timeout);
    }

    return () => {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
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
