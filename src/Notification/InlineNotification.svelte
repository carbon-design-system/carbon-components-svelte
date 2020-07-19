<script>
  export let notificationType = "inline";
  export let kind = "error"; // "error" | "info" | "info-square" | "success" | "warning" | "warning-alt"
  export let role = "alert";
  export let title = "provide a title";
  export let subtitle = "";
  export let iconDescription = "closes notification";
  export let lowContrast = false;
  export let hideCloseButton = false;

  import { createEventDispatcher } from "svelte";
  import NotificationIcon from "./NotificationIcon.svelte";
  import NotificationTextDetails from "./NotificationTextDetails.svelte";
  import NotificationButton from "./NotificationButton.svelte";

  const dispatch = createEventDispatcher();

  $: open = true;
</script>

{#if open}
  <div
    {role}
    {kind}
    class:bx--inline-notification={true}
    class:bx--inline-notification--low-contrast={lowContrast}
    class:bx--inline-notification--hide-close-button={hideCloseButton}
    class={kind && `bx--inline-notification--${kind}`}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave>
    <div class:bx--inline-notification__details={true}>
      <NotificationIcon {notificationType} {kind} {iconDescription} />
      <NotificationTextDetails {title} {subtitle} {notificationType}>
        <slot />
      </NotificationTextDetails>
    </div>
    <slot name="actions" />
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
