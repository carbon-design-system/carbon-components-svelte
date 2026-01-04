<script>
  /**
   * @event close
   * @property {boolean} timeout
   */

  /**
   * Specify the kind of notification.
   * @type {"error" | "info" | "info-square" | "success" | "warning" | "warning-alt"}
   */
  export let kind = "error";

  /** Set to `true` to use the low contrast variant */
  export let lowContrast = false;

  /** Set the timeout duration (ms) to hide the notification after opening it */
  export let timeout = 0;

  /** Set the `role` attribute */
  export let role = "alert";

  /** Specify the title text */
  export let title = "";

  /** Specify the subtitle text */
  export let subtitle = "";

  /** Set to `true` to hide the close button */
  export let hideCloseButton = false;

  /**
   * Specify the ARIA label for the status icon.
   * @type {string}
   * */
  export let statusIconDescription = `${kind} icon`;

  /** Specify the ARIA label for the close button */
  export let closeButtonDescription = "Close notification";

  /**
   * Set to `true` to show the notification, `false` to hide it.
   */
  export let open = true;

  import { createEventDispatcher, onMount } from "svelte";
  import NotificationButton from "./NotificationButton.svelte";
  import NotificationIcon from "./NotificationIcon.svelte";

  const dispatch = createEventDispatcher();

  let timeoutId = undefined;

  function close(closeFromTimeout) {
    const shouldContinue = dispatch(
      "close",
      { timeout: closeFromTimeout === true },
      { cancelable: true },
    );
    if (shouldContinue) {
      open = false;
    }
  }

  $: if (open && timeout) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => close(true), timeout);
  } else {
    clearTimeout(timeoutId);
  }

  onMount(() => {
    return () => {
      clearTimeout(timeoutId);
    };
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if open}
  <div
    {role}
    class:bx--inline-notification={true}
    class:bx--inline-notification--low-contrast={lowContrast}
    class:bx--inline-notification--hide-close-button={hideCloseButton}
    class:bx--inline-notification--error={kind === "error"}
    class:bx--inline-notification--info={kind === "info"}
    class:bx--inline-notification--info-square={kind === "info-square"}
    class:bx--inline-notification--success={kind === "success"}
    class:bx--inline-notification--warning={kind === "warning"}
    class:bx--inline-notification--warning-alt={kind === "warning-alt"}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <div class:bx--inline-notification__details={true}>
      <NotificationIcon
        notificationType="inline"
        {kind}
        iconDescription={statusIconDescription}
      />
      <div class:bx--inline-notification__text-wrapper={true}>
        {#if title || $$slots.titleChildren}
          <p class:bx--inline-notification__title={true}>
            <slot name="titleChildren">{title}</slot>
          </p>
        {/if}
        {#if subtitle || $$slots.subtitleChildren}
          <div class:bx--inline-notification__subtitle={true}>
            <slot name="subtitleChildren">{subtitle}</slot>
          </div>
        {/if}
        <slot />
      </div>
    </div>
    <slot name="actions" />
    {#if !hideCloseButton}
      <NotificationButton
        iconDescription={closeButtonDescription}
        notificationType="inline"
        on:click={close}
      />
    {/if}
  </div>
{/if}
