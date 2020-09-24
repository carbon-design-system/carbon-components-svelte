<script>
  /**
   * Set the type of notification
   * @type {"toast" | "inline"} [notificationType="toast"]
   */
  export let notificationType = "toast";

  /**
   * Specify the icon from `carbon-icons-svelte` to render
   * @type {typeof import("carbon-icons-svelte/lib/Add16").default} [renderIcon]
   */
  export let renderIcon = Close20;

  /**
   * Specify the title of the icon
   * @type {string} [title]
   */
  export let title = undefined;

  /**
   * Specify the ARIA label for the icon
   * @type {string} [iconDescription="Close icon"]
   */
  export let iconDescription = "Close icon";

  import Close20 from "carbon-icons-svelte/lib/Close20";
</script>

<button
  type="button"
  aria-label="{iconDescription}"
  title="{iconDescription}"
  class:bx--toast-notification__close-button="{notificationType === 'toast'}"
  class:bx--inline-notification__close-button="{notificationType === 'inline'}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <svelte:component
    this="{renderIcon}"
    title="{title}"
    class="{notificationType === 'toast' && 'bx--toast-notification__close-icon'}
      {notificationType === 'inline' && 'bx--inline-notification__close-icon'}"
  />
</button>
