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

  /**
   * Set the timeout duration (ms) to hide the notification after opening it.
   * Ignored when the notification is `actionable` or has an `actions` slot.
   */
  export let timeout = 0;

  /** Set to `true` to pause the auto-dismiss timeout while the pointer is over the notification or while focus is inside it. */
  export let pauseOnHover = false;

  /**
   * Specify the ARIA `role` for the notification container.
   * `actionable` overrides it with `alertdialog`.
   * @type {"alert" | "log" | "status"}
   */
  export let role = "status";

  /**
   * Set to `true` when the notification holds an action that users must
   * reach, such as an undo or a retry. The notification becomes an
   * `alertdialog` named by its title, moves focus to its first action
   * (or the close button) when it opens, keeps Tab inside, and closes
   * on Escape.
   */
  export let actionable = false;

  /**
   * Set to `false` to keep focus where it is when an actionable
   * notification opens. Has no effect unless `actionable` is `true`.
   */
  export let focusOnOpen = true;

  /**
   * Set to `false` to keep an actionable notification open on Escape.
   * With `hideCloseButton` also set, Tab can leave the notification.
   * Has no effect unless `actionable` is `true`.
   */
  export let closeOnEscape = true;

  /** Specify the title text */
  export let title = "";

  /** Specify the subtitle text */
  export let subtitle = "";

  /** Specify the caption text */
  export let caption = "";

  /** Specify the ARIA label for the close button */
  export let closeButtonDescription = "Close notification";

  /**
   * Specify the label of the status icon for screen readers.
   * Defaults to the kind, such as "Warning".
   * @type {string | undefined}
   */
  export let statusIconDescription = undefined;

  /** Set to `true` to hide the close button */
  export let hideCloseButton = false;

  /**
   * Set to `true` for the notification to span
   * the full width of its containing element.
   */
  export let fullWidth = false;

  /**
   * Set to `true` to show the notification, `false` to hide it.
   * @bindable writable
   */
  export let open = true;

  import {
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
  } from "svelte";
  import { writable } from "svelte/store";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { createDismissibleNotification } from "../utils/dismissible-notification.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { uniqueId } from "../utils/unique-id.js";
  import NotificationButton from "./NotificationButton.svelte";
  import NotificationIcon from "./NotificationIcon.svelte";
  import { statusIconLabel } from "./status-icon-label.js";

  const dispatch = createEventDispatcher();
  const titleId = uniqueId();
  const subtitleId = uniqueId();

  /** @type {null | HTMLDivElement} */
  let notificationRef = null;

  const describedBy = writable(undefined);

  setContext("carbon:NotificationAction", { describedBy, toast: true });

  // A `NotificationQueue` holds every toast's timer while the pointer or
  // focus is inside the queue.
  const queuePaused = getContext("carbon:NotificationQueue")?.paused;

  const {
    close,
    sync,
    syncFocusOnOpen,
    handleActionableKeydown,
    handleMouseenter,
    handleMouseleave,
    handleFocusIn,
    handleFocusOut,
    setPaused,
    dispose,
  } = createDismissibleNotification({
    dispatch,
    getPauseOnHover: () => pauseOnHover,
    setOpen: (value) => {
      open = value;
    },
    getRef: () => notificationRef,
  });

  $: sync(open, timeout, actionable || !!$$slots.actions);
  $: setPaused(Boolean($queuePaused));
  $: syncFocusOnOpen(open, actionable && focusOnOpen);

  $: hasTitle = !!(title || $$slots.titleChildren);
  $: hasSubtitle = !!(subtitle || $$slots.subtitleChildren);
  $: ({ ariaLabel, ariaLabelledBy, ariaDescribedBy, rest } =
    splitAriaNaming($$restProps));
  // As in Carbon React, the title names the dialog, or the subtitle when
  // there is no title. aria-labelledby beats aria-label, so a consumer
  // aria-label drops the built-in id.
  $: labelId = hasTitle ? titleId : hasSubtitle ? subtitleId : undefined;
  $: builtInLabelledBy = actionable && !ariaLabel ? labelId : undefined;
  $: builtInDescribedBy =
    actionable && hasTitle && hasSubtitle ? subtitleId : undefined;
  // The title describes an action, as in a Callout. An actionable
  // notification is a dialog named by its title, so the action skips it.
  $: describedBy.set(hasTitle && !actionable ? titleId : undefined);

  onMount(() => dispose);
</script>

{#if open}
  <!-- An actionable notification takes focus itself when it holds no button. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    bind:this={notificationRef}
    role={actionable ? "alertdialog" : role}
    tabindex={actionable ? -1 : undefined}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy ?? builtInLabelledBy}
    aria-describedby={joinDescribedBy(builtInDescribedBy, ariaDescribedBy)}
    class:bx--toast-notification={true}
    class:bx--toast-notification--low-contrast={lowContrast}
    class:bx--toast-notification--high-contrast={!lowContrast}
    class:bx--toast-notification--error={kind === "error"}
    class:bx--toast-notification--low-contrast-error={lowContrast &&
      kind === "error"}
    class:bx--toast-notification--info={kind === "info"}
    class:bx--toast-notification--low-contrast-info={lowContrast &&
      kind === "info"}
    class:bx--toast-notification--info-square={kind === "info-square"}
    class:bx--toast-notification--low-contrast-info-square={lowContrast &&
      kind === "info-square"}
    class:bx--toast-notification--success={kind === "success"}
    class:bx--toast-notification--low-contrast-success={lowContrast &&
      kind === "success"}
    class:bx--toast-notification--warning={kind === "warning"}
    class:bx--toast-notification--low-contrast-warning={lowContrast &&
      kind === "warning"}
    class:bx--toast-notification--warning-alt={kind === "warning-alt"}
    class:bx--toast-notification--low-contrast-warning-alt={lowContrast &&
      kind === "warning-alt"}
    style:width={fullWidth ? "100%" : undefined}
    {...rest}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseenter={handleMouseenter}
    on:mouseleave
    on:mouseleave={handleMouseleave}
    on:focusin={handleFocusIn}
    on:focusout={handleFocusOut}
    on:keydown={(event) => {
      if (actionable) {
        handleActionableKeydown(event, { closeOnEscape, hideCloseButton });
      }
    }}
  >
    <NotificationIcon
      {kind}
      {lowContrast}
      iconDescription={statusIconDescription || statusIconLabel(kind)}
    />
    <div class:bx--toast-notification__details={true}>
      {#if hasTitle}
        <h3 id={titleId} class:bx--toast-notification__title={true}>
          <slot name="titleChildren">{title}</slot>
        </h3>
      {/if}
      {#if hasSubtitle}
        <div
          id={actionable ? subtitleId : undefined}
          class:bx--toast-notification__subtitle={true}
        >
          <slot name="subtitleChildren">{subtitle}</slot>
        </div>
      {/if}
      {#if caption || $$slots.captionChildren}
        <div class:bx--toast-notification__caption={true}>
          <slot name="captionChildren">{caption}</slot>
        </div>
      {/if}
      <slot />
      {#if $$slots.actions}
        <div class:bx--toast-notification__actions={true}>
          <slot name="actions" />
        </div>
      {/if}
    </div>
    {#if !hideCloseButton}
      <NotificationButton
        iconDescription={closeButtonDescription}
        {lowContrast}
        on:click={close}
      />
    {/if}
  </div>
{/if}
