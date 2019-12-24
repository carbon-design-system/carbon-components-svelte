<script>
  let className = undefined;
  export { className as class };
  export let kind = 'error';
  export let title = 'provide a title';
  export let subtitle = ''; // TODO: support subtitle slot?
  export let caption = 'provide a caption';
  export let role = 'alert';
  export let notificationType = 'toast';
  export let iconDescription = 'closes notification';
  export let hideCloseButton = false;
  export let lowContrast = false;
  export let timeout = 0;
  export let style = undefined;

  import { createEventDispatcher, onMount } from 'svelte';
  import NotificationIcon from './NotificationIcon.svelte';
  import NotificationTextDetails from './NotificationTextDetails.svelte';
  import NotificationButton from './NotificationButton.svelte';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  let open = true;

  onMount(() => {
    if (timeout) {
      window.setTimeout(() => {
        open = false;
      }, timeout);
    }
  });

  $: if (!open) {
    dispatch('close');
  }
</script>

{#if open}
  <div
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={cx('--toast-notification', lowContrast && '--toast-notification--low-contrast', kind && `--toast-notification--${kind}`, className)}
    {style}
    {role}
    {kind}>
    <NotificationIcon {notificationType} {kind} {iconDescription} />
    <NotificationTextDetails {title} {subtitle} {caption} {notificationType}>
      <slot />
    </NotificationTextDetails>
    {#if !hideCloseButton}
      <NotificationButton
        on:click={() => {
          open = false;
        }}
        {iconDescription}
        {notificationType} />
    {/if}
  </div>
{/if}
