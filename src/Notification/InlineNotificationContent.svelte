<script>
  /**
   * Internal. The icon, text and close button of an `InlineNotification`,
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

<div class:bx--inline-notification__details={true}>
  <NotificationIcon
    notificationType="inline"
    {kind}
    {lowContrast}
    iconDescription={statusIconDescription}
  />
  <div class:bx--inline-notification__text-wrapper={true}>
    {#if hasTitle}
      <p id={titleId} class:bx--inline-notification__title={true}>
        <strong><slot name="titleChildren" /></strong>
      </p>
    {/if}
    {#if hasSubtitle}
      <div id={subtitleId} class:bx--inline-notification__subtitle={true}>
        <slot name="subtitleChildren" />
      </div>
    {/if}
    <slot />
  </div>
</div>
<slot name="actions" />
{#if !hideCloseButton}
  <NotificationButton
    iconDescription={closeButtonDescription}
    {lowContrast}
    notificationType="inline"
    on:click={() => dispatch("close")}
  />
{/if}
