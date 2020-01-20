<script>
  let className = undefined;
  export { className as class };
  export let hideCloseButton = false;
  export let iconDescription = 'closes notification';
  export let kind = 'error';
  export let lowContrast = false;
  export let notificationType = 'inline';
  export let role = 'alert';
  export let style = undefined;
  export let subtitle = ''; // TODO: support subtitle slot?
  export let title = 'provide a title';

  import { createEventDispatcher } from 'svelte';
  import NotificationIcon from './NotificationIcon.svelte';
  import NotificationTextDetails from './NotificationTextDetails.svelte';
  import NotificationButton from './NotificationButton.svelte';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  let open = true;

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
    class={cx('--inline-notification', lowContrast && '--inline-notification--low-contrast', kind && `--inline-notification--${kind}`, hideCloseButton && '--inline-notification--hide-close-button', className)}
    {style}
    {role}
    {kind}>
    <div class={cx('--inline-notification__details')}>
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
        }} />
    {/if}
  </div>
{/if}
