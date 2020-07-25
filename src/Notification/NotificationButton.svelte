<script>
  /**
   * Set the type of notification
   * @type {"toast" | "inline"} [notificationType="toast"]
   */
  export let notificationType = "toast";
  export let iconDescription = "close icon";
  export let renderIcon = Close20;
  export let title = undefined;
  export let type = "button";

  import Close20 from "carbon-icons-svelte/lib/Close20";
</script>

<button
  aria-label={iconDescription}
  title={iconDescription}
  {type}
  class:bx--toast-notification__close-button={notificationType === 'toast'}
  class:bx--inline-notification__close-button={notificationType === 'inline'}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <svelte:component
    this={renderIcon}
    {title}
    class="{notificationType === 'toast' && 'bx--toast-notification__close-icon'}
    {notificationType === 'inline' && 'bx--inline-notification__close-icon'}" />
</button>
