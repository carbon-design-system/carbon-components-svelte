<script>
  /**
   * Set the type of notification
   * @type {"toast" | "inline"}
   */
  export let notificationType = "toast";

  /**
   * Specify the icon to render
   * @type {typeof import("svelte").SvelteComponent<any>}
   */
  export let icon = Close;

  /**
   * Specify the title of the icon
   * @type {string}
   */
  export let title = undefined;

  /** Specify the ARIA label for the icon */
  export let iconDescription = "Close icon";

  import Close from "../icons/Close.svelte";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
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
    this="{icon}"
    size="{20}"
    title="{title}"
    class="{notificationType === 'toast' &&
      'bx--toast-notification__close-icon'} {notificationType === 'inline' &&
      'bx--inline-notification__close-icon'}"
  />
</button>
