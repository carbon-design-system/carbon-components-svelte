<script>
  /**
   * @event close
   * @property {boolean} timeout
   */

  /**
   * Specify the kind of notification.
   * @type {"error"
   *   | "info"
   *   | "info-square"
   *   | "success"
   *   | "warning"
   *   | "warning-alt"}
   */
  export let kind = "error";

  /** Set to `true` to use the low contrast variant */
  export let lowContrast = false;

  /**
   * Set the timeout duration (ms) to hide the notification after
   * opening it
   */
  export let timeout = 0;

  /**
   * Set to `true` to pause the auto-dismiss timeout while the pointer
   * is over the notification or while focus is inside it.
   */
  export let pauseOnHover = false;

  /**
   * Specify the ARIA `role` for the notification container.
   * @type {"alert" | "log" | "status"}
   */
  export let role = "alert";

  /** Specify the title text */
  export let title = "";

  /** Specify the subtitle text */
  export let subtitle = "";

  /** Set to `true` to hide the close button */
  export let hideCloseButton = false;

  /** Specify the ARIA label for the close button */
  export let closeButtonDescription = "Close notification";

  /**
   * Set to `true` to show the notification, `false` to hide it.
   * @bindable writable
   */
  export let open = true;

  import { createEventDispatcher, onMount } from "svelte";
  import { createDismissibleNotification } from "../utils/dismissible-notification.js";
  import NotificationButton from "./NotificationButton.svelte";
  import NotificationIcon from "./NotificationIcon.svelte";

  const dispatch = createEventDispatcher();

  const {
    close,
    sync,
    handleMouseenter,
    handleMouseleave,
    handleFocusIn,
    handleFocusOut,
    dispose,
  } = createDismissibleNotification({
    dispatch,
    getPauseOnHover: () => pauseOnHover,
    setOpen: (value) => {
      open = value;
    },
  });

  $: sync(open, timeout);

  onMount(() => dispose);
</script>

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
    on:mouseenter={handleMouseenter}
    on:mouseleave
    on:mouseleave={handleMouseleave}
    on:focusin={handleFocusIn}
    on:focusout={handleFocusOut}
  >
    <div class:bx--inline-notification__details={true}>
      <NotificationIcon notificationType="inline" {kind} />
      <div class:bx--inline-notification__text-wrapper={true}>
        {#if title || $$slots.titleChildren}
          <p class:bx--inline-notification__title={true}>
            <strong><slot name="titleChildren">{title}</slot></strong>
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
