<script>
  let className = undefined;
  export { className as class };
  export let caption = 'provide a caption';
  export let hideCloseButton = false;
  export let iconDescription = 'closes notification';
  export let kind = 'error';
  export let lowContrast = false;
  export let notificationType = 'toast';
  export let role = 'alert';
  export let style = undefined;
  export let subtitle = ''; // TODO: support subtitle slot?
  export let timeout = 0;
  export let title = 'provide a title';

  import { createEventDispatcher, onMount } from 'svelte';
  import NotificationButton from './NotificationButton.svelte';
  import NotificationIcon from './NotificationIcon.svelte';
  import NotificationTextDetails from './NotificationTextDetails.svelte';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  let timeoutId = undefined;
  let open = true;

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
