<script>
  /**
   * Internal. The icon, text and close button of a `ToastNotification`,
   * shared by its animated and plain roots. The parent forwards its slots
   * and says which have content, since a forwarded slot is always present.
   */

  /**
   * @type {"error" | "info" | "info-square" | "success" | "warning" | "warning-alt"}
   */
  export let kind = "error";

  export let lowContrast = false;

  /** @type {string} */
  export let statusIconDescription = "";

  export let hasTitle = false;

  export let hasSubtitle = false;

  export let hasCaption = false;

  export let hasActions = false;

  /** @type {string} */
  export let titleId = "";

  /** @type {string | undefined} */
  export let subtitleId = undefined;

  export let hideCloseButton = false;

  /** @type {string} */
  export let closeButtonDescription = "Close notification";

  import { createEventDispatcher } from "svelte";
  import NotificationButton from "./NotificationButton.svelte";
  import NotificationIcon from "./NotificationIcon.svelte";

  const dispatch = createEventDispatcher();
</script>

<NotificationIcon
  {kind}
  {lowContrast}
  iconDescription={statusIconDescription}
/>
<div class:bx--toast-notification__details={true}>
  {#if hasTitle}
    <!-- biome-ignore lint/a11y/useHeadingContent: the parent forwards the title slot, with `title` as its fallback -->
    <h3 id={titleId} class:bx--toast-notification__title={true}>
      <slot name="titleChildren" />
    </h3>
  {/if}
  {#if hasSubtitle}
    <div id={subtitleId} class:bx--toast-notification__subtitle={true}>
      <slot name="subtitleChildren" />
    </div>
  {/if}
  {#if hasCaption}
    <div class:bx--toast-notification__caption={true}>
      <slot name="captionChildren" />
    </div>
  {/if}
  <slot />
  {#if hasActions}
    <div class:bx--toast-notification__actions={true}>
      <slot name="actions" />
    </div>
  {/if}
</div>
{#if !hideCloseButton}
  <NotificationButton
    iconDescription={closeButtonDescription}
    {lowContrast}
    on:click={() => dispatch("close")}
  />
{/if}
