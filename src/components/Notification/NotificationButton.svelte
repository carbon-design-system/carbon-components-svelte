<script>
  let className = undefined;
  export { className as class };
  export let iconDescription = 'close icon';
  export let notificationType = 'toast';
  export let renderIcon = Close20;
  export let style = undefined;
  export let title = undefined;
  export let type = 'button';

  import Close20 from 'carbon-icons-svelte/lib/Close20';
  import { cx } from '../../lib';
</script>

<button
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  aria-label={iconDescription}
  title={iconDescription}
  class={cx(notificationType === 'toast' && '--toast-notification__close-button', notificationType === 'inline' && '--inline-notification__close-button', className)}
  {style}
  {type}>
  <svelte:component
    this={renderIcon}
    class={cx(notificationType === 'toast' && '--toast-notification__close-icon', notificationType === 'inline' && '--inline-notification__close-icon')}
    {title} />
</button>
