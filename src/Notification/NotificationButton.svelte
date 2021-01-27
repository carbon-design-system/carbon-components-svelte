<script>
  /**
   * Set the type of notification
   * @type {"toast" | "inline"}
   */
  export let notificationType = "toast";

  /**
   * Specify the icon from `carbon-icons-svelte` to render
   * @type {typeof import("carbon-icons-svelte").CarbonIcon}
   */
  export let icon = Close20;

  /**
   * Specify the title of the icon
   * @type {string}
   */
  export let title = undefined;

  /** Specify the ARIA label for the icon */
  export let iconDescription = "Close icon";

  import Close20 from "carbon-icons-svelte/lib/Close20/Close20.svelte";
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
    this="{icon}"
    title="{title}"
    class="bx--{notificationType}-notification__close-icon"
  />
</button>
