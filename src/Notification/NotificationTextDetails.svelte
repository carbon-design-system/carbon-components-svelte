<script>
  /**
   * @deprecated
   * This component will be removed in version 1.0.0.
   */

  /**
   * Set the type of notification
   * @type {"toast" | "inline"}
   */
  export let notificationType = "toast";

  /** Specify the title text */
  export let title = "Title";

  /** Specify the subtitle text */
  export let subtitle = "";

  /** Specify the caption text */
  export let caption = "Caption";
</script>

{#if notificationType === "toast"}
  <div class:bx--toast-notification__details="{true}">
    <h3 class:bx--toast-notification__title="{true}">{title}</h3>
    <div class:bx--toast-notification__subtitle="{true}">{subtitle}</div>
    <div class:bx--toast-notification__caption="{true}">{caption}</div>
    <slot />
  </div>
{/if}

{#if notificationType === "inline"}
  <div class:bx--inline-notification__text-wrapper="{true}">
    <p class:bx--inline-notification__title="{true}">{title}</p>
    <div class:bx--inline-notification__subtitle="{true}">{subtitle}</div>
    <slot />
  </div>
{/if}
