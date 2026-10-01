<script>
  /**
   * @template [Icon=any]
   */

  /**
   * Set the type of notification.
   * @type {"toast" | "inline"}
   */
  export let notificationType = "toast";

  /** Set to `true` to use the low contrast icon fill. */
  export let lowContrast = false;

  /**
   * Specify the icon to render.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (Close);

  /**
   * Specify the title of the icon.
   * @type {string}
   */
  export let title = undefined;

  /** Specify the ARIA label for the icon */
  export let iconDescription = "Close icon";

  import Close from "../icons/Close.svelte";

  $: iconClass = [
    notificationType === "toast" && "bx--toast-notification__close-icon",
    notificationType === "toast" &&
      lowContrast &&
      "bx--toast-notification__close-icon--low-contrast",
    notificationType === "inline" && "bx--inline-notification__close-icon",
    notificationType === "inline" &&
      lowContrast &&
      "bx--inline-notification__close-icon--low-contrast",
  ]
    .filter(Boolean)
    .join(" ");
</script>

<button
  type="button"
  aria-label={iconDescription}
  title={iconDescription}
  class:bx--toast-notification__close-button={notificationType === "toast"}
  class:bx--inline-notification__close-button={notificationType === "inline"}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <svelte:component this={icon} size={20} {title} class={iconClass} />
</button>
