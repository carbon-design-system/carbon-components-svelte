<script>
  /**
   * @event close
   * @property {boolean} timeout
   */

  /**
   * @event {CustomEvent<null>} introstart
   * @event {CustomEvent<null>} introend
   * @event {CustomEvent<null>} outrostart
   * @event {CustomEvent<null>} outroend
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

  /**
   * Set an id for the top-level element. The title and subtitle ids derive
   * from it as `{id}-title` and `{id}-subtitle`, so the server and the
   * browser render the same ids.
   * @type {string | undefined}
   */
  export let id = undefined;

  /**
   * Animate the notification as it opens and closes, and when a parent's
   * `{#if}` adds or removes it. Set to `true` for Carbon's slide, which
   * animates height, padding and margin so the content below moves with
   * it (`moderate02`), to slide params (e.g., `{ duration: "slow01" }`) to
   * customize it, or to `{ fn }` to use another transition. The
   * notification does not animate by default.
   * @type {import("../motion/resolve-transition.js").TransitionProp<import("../motion/transitions.js").SlideParams>}
   */
  export let transition = undefined;

  import { createEventDispatcher, onMount, setContext } from "svelte";
  import { writable } from "svelte/store";
  import { resolveTransition } from "../motion/resolve-transition.js";
  import { slide } from "../motion/transitions.js";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { createDismissibleNotification } from "../utils/dismissible-notification.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { uniqueId } from "../utils/unique-id.js";
  import InlineNotificationContent from "./InlineNotificationContent.svelte";
  import { statusIconLabel } from "./status-icon-label.js";

  const dispatch = createEventDispatcher();
  const slidePreset = { fn: slide };
  const fallbackId = uniqueId();
  $: titleId = `${id ?? fallbackId}-title`;
  $: subtitleId = `${id ?? fallbackId}-subtitle`;

  /** @type {null | HTMLDivElement} */
  let notificationRef = null;

  /** @type {import("svelte/store").Writable<string | undefined>} */
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

  $: ({
    fn: transitionFn,
    params: transitionParams,
    animated,
  } = resolveTransition(transition, slidePreset));

  $: sync(open, timeout, actionable || !!$$slots.actions);
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
  {#if animated}
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
      {id}
      {...rest}
      transition:transitionFn|global={transitionParams}
      on:introstart
      on:introend
      on:outrostart
      on:outroend
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
      <InlineNotificationContent
        {kind}
        {lowContrast}
        statusIconDescription={statusIconDescription || statusIconLabel(kind)}
        {hasTitle}
        {hasSubtitle}
        {titleId}
        subtitleId={actionable ? subtitleId : undefined}
        {hideCloseButton}
        {closeButtonDescription}
        on:close={() => close()}
      >
        <slot name="titleChildren" slot="titleChildren">{title}</slot>
        <slot name="subtitleChildren" slot="subtitleChildren">{subtitle}</slot>
        <slot />
        <slot name="actions" slot="actions" />
      </InlineNotificationContent>
    </div>
  {:else}
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
      {id}
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
      <InlineNotificationContent
        {kind}
        {lowContrast}
        statusIconDescription={statusIconDescription || statusIconLabel(kind)}
        {hasTitle}
        {hasSubtitle}
        {titleId}
        subtitleId={actionable ? subtitleId : undefined}
        {hideCloseButton}
        {closeButtonDescription}
        on:close={() => close()}
      >
        <slot name="titleChildren" slot="titleChildren">{title}</slot>
        <slot name="subtitleChildren" slot="subtitleChildren">{subtitle}</slot>
        <slot />
        <slot name="actions" slot="actions" />
      </InlineNotificationContent>
    </div>
  {/if}
{/if}
