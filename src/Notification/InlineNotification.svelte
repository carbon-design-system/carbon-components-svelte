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

  /** Set to `true` to hide the close button */
  export let hideCloseButton = false;

  /** Specify the ARIA label for the close button */
  export let closeButtonDescription = "Close notification";

  /**
   * Specify the label of the status icon for screen readers.
   * Defaults to the kind, such as "Warning".
   * @type {string | undefined}
   */
  export let statusIconDescription = undefined;

  /**
   * Set to `true` for the notification to fill its parent's width, without
   * the default width limits and outer margin, as when it sits inside a card,
   * a form, or another layout that spaces its own content.
   */
  export let fullWidth = false;

  /**
   * Set to `true` to show the notification, `false` to hide it.
   * @bindable writable
   */
  export let open = true;

  import { createEventDispatcher, onMount, setContext } from "svelte";
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

  setContext("carbon:NotificationAction", { describedBy, toast: false });

  const {
    close,
    sync,
    syncFocusOnOpen,
    handleActionableKeydown,
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
    getRef: () => notificationRef,
  });

  $: sync(open, timeout);
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
    class:bx--inline-notification={true}
    class:bx--inline-notification--low-contrast={lowContrast}
    class:bx--inline-notification--high-contrast={!lowContrast}
    class:bx--inline-notification--hide-close-button={hideCloseButton}
    class:bx--inline-notification--full-width={fullWidth}
    class:bx--inline-notification--error={kind === "error"}
    class:bx--inline-notification--low-contrast-error={lowContrast &&
      kind === "error"}
    class:bx--inline-notification--info={kind === "info"}
    class:bx--inline-notification--low-contrast-info={lowContrast &&
      kind === "info"}
    class:bx--inline-notification--info-square={kind === "info-square"}
    class:bx--inline-notification--low-contrast-info-square={lowContrast &&
      kind === "info-square"}
    class:bx--inline-notification--success={kind === "success"}
    class:bx--inline-notification--low-contrast-success={lowContrast &&
      kind === "success"}
    class:bx--inline-notification--warning={kind === "warning"}
    class:bx--inline-notification--low-contrast-warning={lowContrast &&
      kind === "warning"}
    class:bx--inline-notification--warning-alt={kind === "warning-alt"}
    class:bx--inline-notification--low-contrast-warning-alt={lowContrast &&
      kind === "warning-alt"}
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
    <div class:bx--inline-notification__details={true}>
      <NotificationIcon
        notificationType="inline"
        {kind}
        {lowContrast}
        iconDescription={statusIconDescription || statusIconLabel(kind)}
      />
      <div class:bx--inline-notification__text-wrapper={true}>
        {#if hasTitle}
          <p id={titleId} class:bx--inline-notification__title={true}>
            <strong><slot name="titleChildren">{title}</slot></strong>
          </p>
        {/if}
        {#if hasSubtitle}
          <div
            id={actionable ? subtitleId : undefined}
            class:bx--inline-notification__subtitle={true}
          >
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
        {lowContrast}
        notificationType="inline"
        on:click={close}
      />
    {/if}
  </div>
{/if}
