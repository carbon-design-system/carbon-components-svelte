<script>
  /** @template {import("../utils/icon-component.js").IconComponent} [Icon=any] */

  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "close-button" | "programmatic"} trigger
   */

  /** @event {null} open */

  /**
   * @event transitionend
   * @type {object}
   * @property {boolean} open
   */

  /**
   * @event click:button--secondary
   * @type {object}
   * @property {string} text
   */

  /**
   * @event {null} loading:success - Dispatched when `loadingStatus` is `"finished"`, after the `InlineLoading` success delay.
   * @restProps {div}
   */

  /**
   * @slot {{}} labelChildren - Custom label content. Replaces `modalLabel`.
   * @deprecated use the `labelChildren` slot
   * @slot {{}} label
   */

  /**
   * Set the size of the modal.
   * Also accepts Carbon v11's `"md"`, the default width.
   * @type {"xs" | "sm" | "md" | "lg" | undefined}
   */
  export let size = undefined;

  /**
   * Set to `true` to open the modal.
   * @bindable writable
   */
  export let open = false;

  /** Set to `true` to use the danger variant */
  export let danger = false;

  /** Set to `true` to enable alert mode */
  export let alert = false;

  /** Set to `true` to use the passive variant */
  export let passiveModal = false;

  /** Set to `true` to remove the modal body padding so content spans edge to edge */
  export let fullWidth = false;

  /**
   * Specify the modal heading.
   * @type {string | undefined}
   */
  export let modalHeading = undefined;

  /**
   * Specify the modal label.
   * Alternatively, use the "labelChildren" slot.
   * @type {string | undefined}
   */
  export let modalLabel = undefined;

  /**
   * Specify the ARIA label for the modal.
   * @type {string | undefined}
   */
  export let modalAriaLabel = undefined;

  /**
   * Specify the label of the close button.
   * It names the button and shows in its tooltip.
   */
  export let iconDescription = "Close the modal";

  /** Set to `true` if the modal contains form elements */
  export let hasForm = false;

  /**
   * Specify the ID of a form element to associate with the primary button.
   * This enables the primary button to submit the form from outside the form element.
   * @type {string | undefined}
   */
  export let formId = undefined;

  /** Set to `true` if the modal contains scrolling content */
  export let hasScrollingContent = false;

  /** Specify the primary button text */
  export let primaryButtonText = "";

  /** Set to `true` to disable the primary button */
  export let primaryButtonDisabled = false;

  /**
   * Set to `true` to show a loading state on the primary button.
   * While loading, the button is non-interactive and submit is suppressed.
   * Same as `loadingStatus="active"`, except that the secondary buttons
   * stay enabled. `loadingStatus` wins when it is not `"inactive"`.
   */
  export let primaryButtonLoading = false;

  /**
   * Set the loading status of the footer.
   * Any status other than `"inactive"` shows `InlineLoading` with that
   * status in the primary button, disables the footer buttons, and
   * suppresses submit. `"finished"` dispatches `loading:success` after the
   * success delay.
   * @type {"inactive" | "active" | "finished" | "error"}
   */
  export let loadingStatus = "inactive";

  /**
   * Specify the description for the primary button loading state.
   * Passed to `InlineLoading` as `description`.
   */
  export let primaryButtonLoadingDescription = "Loading";

  /**
   * Specify the description for the primary button loading icon.
   * Passed to `InlineLoading` as `iconDescription`.
   * @type {string | undefined}
   */
  export let primaryButtonLoadingIconDescription = undefined;

  /**
   * Specify the primary button icon.
   * @type {Icon | undefined}
   */
  export let primaryButtonIcon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Set to `true` for the "submit" and "click:button--primary" events
   * to be dispatched when pressing "Enter".
   */
  export let shouldSubmitOnEnter = true;

  /** Specify the secondary button text */
  export let secondaryButtonText = "";

  /**
   * Set to `true` to show a loading state on the secondary button.
   * Only applies to the `secondaryButtonText` path (not `secondaryButtons`).
   * While loading, the button is non-interactive.
   */
  export let secondaryButtonLoading = false;

  /**
   * Specify the description for the secondary button loading state.
   * Passed to `InlineLoading` as `description`.
   */
  export let secondaryButtonLoadingDescription = "Loading";

  /**
   * One or two secondary buttons for the modal footer.
   * Supersedes `secondaryButtonText`. Each entry needs `text`; optional
   * `kind` (defaults to `"secondary"`), `disabled`, `loading`, and
   * `loadingDescription` (defaults to `"Loading"`) pass through to Button /
   * the loading state. With two entries plus a primary button, the footer
   * uses the three-button layout.
   * @type {ReadonlyArray<{ text: string; kind?: import("../Button/Button.svelte").ButtonProps["kind"]; disabled?: boolean; loading?: boolean; loadingDescription?: string }>}
   */
  export let secondaryButtons = [];

  /**
   * Specify a selector to be focused when opening the modal.
   * Set to `null` to skip initial focus and move focus yourself.
   * @type {null | string}
   */
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";

  /**
   * Control whether clicking outside the modal closes it.
   * By default, a passive modal (`passiveModal`) closes and a modal with
   * actions stays open, as in Carbon v11.
   * Set to `true` to always keep the modal open on an outside click, or
   * `false` to always close it.
   * @type {boolean | undefined}
   */
  export let preventCloseOnClickOutside = undefined;

  /**
   * Set to `true` to hide the header close button.
   * Provide an alternative dismiss path (footer actions or Escape).
   */
  export let hideCloseButton = false;

  /**
   * Set to `true` to build the modal's content the first time it opens
   * instead of at mount, and keep it afterwards. A closed modal is still
   * laid out (it is only made invisible), so this saves its nodes on pages
   * that hold modals most visitors never open. Content is not in the DOM,
   * or in server-rendered markup, until then.
   */
  export let lazy = false;

  /** Set an id for the top-level element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount, setContext } from "svelte";
  import { readable, writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";
  import Button from "../Button/Button.svelte";
  import InlineLoading from "../InlineLoading/InlineLoading.svelte";
  import {
    LAYER_CONTEXT_KEY,
    MODAL_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import Close from "../icons/Close.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { createDialogLifecycle } from "../utils/dialog-lifecycle.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { focusQuietly, initialFocus, restoreFocus } from "../utils/focus.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { scrollIntoViewWithin } from "../utils/scroll-into-view-within.js";
  import { trapFocus } from "../utils/trap-focus.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { trackModal } from "./modal-store.js";

  const dispatch = createEventDispatcher();
  const focusReturn = restoreFocus();

  let buttonRef = null;
  let primaryButtonRef = null;
  /** @type {null | HTMLDivElement} */
  let innerModalRef = null;

  function focus(node) {
    const container = node || innerModalRef;
    const target = initialFocus({
      container,
      selectorPrimaryFocus,
      fallbacks: [
        danger ? container.querySelector(".bx--btn--secondary") : null,
        primaryButtonRef,
        buttonRef,
        // With nothing else to focus, focus the dialog itself so Escape
        // and Tab reach the root's keydown handler.
        container,
      ],
    });
    // The user didn't ask for a tooltip on the first focus target, so a
    // single Escape still closes the modal.
    if (target) focusQuietly(target);
  }

  const lifecycle = createDialogLifecycle({
    dispatch,
    setOpen: (value) => {
      open = value;
    },
    preventCloseOnClickOutside: () => preventCloseOnClickOutside,
    passive: () => passiveModal,
    saveFocusReturn: focusReturn.save,
    restoreFocusReturn: () => focusReturn.restore(ref),
    getContainer: () => innerModalRef,
    focus: () => focus(),
    getOpen: () => open,
  });
  const { close, outsideDismiss } = lifecycle;

  const sharedOpen = writable(open);
  $: $sharedOpen = open;
  trackModal(sharedOpen);

  setContext(MODAL_CONTEXT_KEY, {});
  // As in v11, the modal starts a layer at level 0 wherever it renders,
  // and its body is a layer at level 1, so a `Layer` inside sits at 2.
  setContext(LAYER_CONTEXT_KEY, readable(2));

  // Initial mount already runs the reactive block below, which handles
  // dispatching "open" and the `prevOpen`/`focusReturn.save()` bookkeeping.
  // What it can't do is focus the modal: reactive statements run *before*
  // the DOM is committed, so `innerModalRef` isn't attached yet. `onMount`
  // runs after mount, so the DOM is already in place — no `tick()` needed.
  onMount(() => {
    lifecycle.setMounted();
    if (open) {
      focus();
    }
  });

  $: lifecycle.syncOpen(open);

  // `lazy`: the body and footer mount on the first open and then stay.
  let openedOnce = open;
  $: if (open) openedOnce = true;
  $: renderContent = !lazy || openedOnce;

  $: modalLabelId = `bx--modal-header__label--modal-${id}`;
  $: modalHeadingId = `bx--modal-header__heading--modal-${id}`;
  $: modalBodyId = `bx--modal-body--${id}`;
  // The root carries `role="presentation"`, so consumer naming and
  // description go on the dialog element instead.
  $: ({
    ariaLabel: consumerLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
  // A consumer `aria-label` names the dialog. The scrolling region keeps
  // the built-in name so the consumer label stays on the dialog alone.
  $: builtInLabel = modalLabel ?? modalAriaLabel ?? modalHeading;
  $: ariaLabel = consumerLabel ?? builtInLabel;

  $: footerBusy = Boolean(loadingStatus) && loadingStatus !== "inactive";
  // `primaryButtonLoading` is the boolean form of "active"; a status
  // other than "inactive" takes precedence.
  $: primaryStatus = footerBusy
    ? loadingStatus
    : primaryButtonLoading
      ? "active"
      : "inactive";
  $: primaryBusy = primaryStatus !== "inactive";

  /**
   * Starts active for a filled slot, so the server renders the AI surface.
   * `Decorator` clears it when no `AILabel` claims the slot.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  const aiLabelState = writable($$slots.decorator ? "active" : undefined);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  bind:this={ref}
  role="presentation"
  {id}
  class:bx--modal={true}
  class:bx--layer-one={true}
  class:bx--modal-tall={!passiveModal}
  class:is-visible={open}
  class:bx--modal--danger={danger}
  class:bx--modal--decorator={$$slots.decorator}
  class:bx--modal--ai-label={$aiLabelState === "active"}
  inert={open ? undefined : true}
  {...wrapperProps}
  on:keydown
  on:keydown={(event) => {
    if (open) {
      if (event.key === "Escape") {
        // Escape that cancels an IME composition is not a close.
        if (isImeComposition(event)) return;
        // Stop stacked (DOM-nested) modals from also closing: this
        // handler is on each modal's own root and Escape bubbles from
        // the focused (innermost, topmost) modal up through ancestors.
        event.stopPropagation();
        close("escape-key");
      } else if (event.key === "Tab" && !event.defaultPrevented) {
        // A nested modal or a child that uses Tab itself (an editor that
        // indents) already handled this Tab; trapping again moves focus twice.
        trapFocus({ container: ref, event });
      } else if (
        shouldSubmitOnEnter &&
        event.key === "Enter" &&
        !primaryButtonDisabled &&
        !primaryBusy
      ) {
        // Enter that commits an IME composition is not a submit.
        if (isImeComposition(event)) return;
        const target = /** @type {HTMLElement | null} */ (event.target);
        const tag = target?.tagName;
        if (
          tag === "BUTTON" ||
          tag === "A" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target?.isContentEditable
        ) {
          return;
        }
        if (formId && primaryButtonRef) {
          primaryButtonRef.click();
        } else {
          dispatch("submit");
          dispatch("click:button--primary");
        }
      }
    }
  }}
  on:click
  on:mousedown={(event) => {
    if (event.target === event.currentTarget) outsideDismiss.pressOutside();
  }}
  on:mouseup={outsideDismiss.release}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:transitionend={(event) => {
    if (event.propertyName === "transform") {
      dispatch("transitionend", { open });
      if (!open) focusReturn.restore(ref);
    }
  }}
>
  <div
    bind:this={innerModalRef}
    tabindex="-1"
    role={alert ? (passiveModal ? "alert" : "alertdialog") : "dialog"}
    aria-describedby={joinDescribedBy(
      alert && !passiveModal ? modalBodyId : undefined,
      ariaDescribedBy,
    )}
    aria-modal="true"
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    class:bx--modal-container={true}
    class:bx--modal-container--xs={size === "xs"}
    class:bx--modal-container--sm={size === "sm"}
    class:bx--modal-container--lg={size === "lg"}
    class:bx--modal-container--full-width={fullWidth}
    on:mousedown={outsideDismiss.pressInside}
  >
    <div class:bx--modal-header={true}>
      {#if passiveModal && !hideCloseButton}
        <div class:bx--modal-close-button={true}>
          <Button
            bind:ref={buttonRef}
            kind="ghost"
            class="bx--modal-close"
            {iconDescription}
            aria-label={iconDescription}
            tooltipPosition="left"
            on:click={() => {
              close("close-button");
            }}
          >
            <Close
              slot="icon"
              size={20}
              class="bx--modal-close__icon"
              aria-hidden="true"
            />
          </Button>
        </div>
      {/if}
      {#if modalLabel || $$slots.labelChildren || $$slots.label}
        <h2 id={modalLabelId} class:bx--modal-header__label={true}>
          <slot name="labelChildren"
            ><slot name="label">{modalLabel}</slot></slot
          >
        </h2>
      {/if}
      <h2 id={modalHeadingId} class:bx--modal-header__heading={true}>
        <slot name="heading">{modalHeading}</slot>
      </h2>
      {#if $$slots.decorator}
        <Decorator
          class="bx--modal--inner__decorator"
          state={aiLabelState}
          labelSize="sm"
        >
          <slot name="decorator" />
        </Decorator>
      {/if}
      {#if !passiveModal && !hideCloseButton}
        <div class:bx--modal-close-button={true}>
          <Button
            bind:ref={buttonRef}
            kind="ghost"
            class="bx--modal-close"
            {iconDescription}
            aria-label={iconDescription}
            tooltipPosition="left"
            on:click={() => {
              close("close-button");
            }}
          >
            <Close
              slot="icon"
              size={20}
              class="bx--modal-close__icon"
              aria-hidden="true"
            />
          </Button>
        </div>
      {/if}
    </div>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
      id={modalBodyId}
      class:bx--modal-content={true}
      class:bx--layer-two={true}
      class:bx--modal-content--with-form={hasForm}
      class:bx--modal-scroll-content={hasScrollingContent}
      tabindex={hasScrollingContent ? 0 : undefined}
      role={hasScrollingContent ? "region" : undefined}
      aria-label={hasScrollingContent ? builtInLabel : undefined}
      aria-labelledby={modalLabel ? modalLabelId : modalHeadingId}
      on:focusin={(event) => {
        // Keep a newly-focused element (e.g. via Tab) from being hidden
        // under the scroll gradient at the bottom of the content area.
        if (event.target instanceof HTMLElement) {
          scrollIntoViewWithin(event.target, ".bx--modal-content");
        }
      }}
    >
      {#if renderContent}
        <slot />
      {/if}
    </div>
    {#if hasScrollingContent}
      <div class:bx--modal-content--overflow-indicator={true}></div>
    {/if}
    {#if !passiveModal && renderContent}
      <div
        class:bx--modal-footer={true}
        class:bx--modal-footer--three-button={secondaryButtons.length === 2}
        aria-busy={primaryStatus === "active" ? "true" : undefined}
      >
        {#if secondaryButtons.length > 0}
          {#each secondaryButtons as button (button.text)}
            <Button
              size="default"
              kind={button.kind ?? "secondary"}
              disabled={button.disabled || button.loading || footerBusy}
              on:click={() => {
                if (button.loading || footerBusy) return;
                dispatch("click:button--secondary", { text: button.text });
              }}
            >
              {#if button.loading}
                <InlineLoading
                  class="bx--inline-loading--btn"
                  status="active"
                  description={button.loadingDescription ?? "Loading"}
                />
              {:else}
                {button.text}
              {/if}
            </Button>
          {/each}
        {:else if secondaryButtonText}
          <Button
            size="default"
            kind="secondary"
            disabled={secondaryButtonLoading || footerBusy}
            on:click={() => {
              if (secondaryButtonLoading || footerBusy) return;
              dispatch("click:button--secondary", {
                text: secondaryButtonText,
              });
            }}
          >
            {#if secondaryButtonLoading}
              <InlineLoading
                class="bx--inline-loading--btn"
                status="active"
                description={secondaryButtonLoadingDescription}
              />
            {:else}
              {secondaryButtonText}
            {/if}
          </Button>
        {/if}
        <Button
          size="default"
          bind:ref={primaryButtonRef}
          kind={danger ? "danger" : "primary"}
          disabled={primaryButtonDisabled || primaryBusy}
          icon={primaryBusy ? undefined : primaryButtonIcon}
          type={formId ? "submit" : "button"}
          form={formId}
          on:click={() => {
            if (primaryBusy) return;
            dispatch("submit");
            dispatch("click:button--primary");
          }}
        >
          {#if primaryBusy}
            <InlineLoading
              class="bx--inline-loading--btn"
              status={primaryStatus}
              description={primaryButtonLoadingDescription}
              iconDescription={primaryButtonLoadingIconDescription}
              on:success={() => dispatch("loading:success")}
            />
          {:else}
            {primaryButtonText}
          {/if}
        </Button>
      </div>
    {/if}
  </div>
</div>
