<script>
  /**
   * @template [Icon=any]
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "close-button" | "programmatic"} trigger
   * @event transitionend
   * @type {object}
   * @property {boolean} open
   * @event click:button--secondary
   * @type {object}
   * @property {string} text
   */

  /**
   * Set the size of the modal.
   * @type {"xs" | "sm" | "lg"}
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

  /**
   * Specify the modal heading.
   * @type {string}
   */
  export let modalHeading = undefined;

  /**
   * Specify the modal label.
   * @type {string}
   */
  export let modalLabel = undefined;

  /**
   * Specify the ARIA label for the modal.
   * @type {string}
   */
  export let modalAriaLabel = undefined;

  /** Specify the ARIA label for the close icon */
  export let iconDescription = "Close the modal";

  /** Set to `true` if the modal contains form elements */
  export let hasForm = false;

  /**
   * Specify the ID of a form element to associate with the primary button.
   * This enables the primary button to submit the form from outside the form element.
   * @type {string}
   */
  export let formId = undefined;

  /** Set to `true` if the modal contains scrolling content */
  export let hasScrollingContent = false;

  /** Specify the primary button text */
  export let primaryButtonText = "";

  /** Set to `true` to disable the primary button */
  export let primaryButtonDisabled = false;

  /**
   * Specify the primary button icon.
   * @type {Icon}
   */
  export let primaryButtonIcon = /** @type {Icon} */ (undefined);

  /**
   * Set to `true` for the "submit" and "click:button--primary" events
   * to be dispatched when pressing "Enter".
   */
  export let shouldSubmitOnEnter = true;

  /** Specify the secondary button text */
  export let secondaryButtonText = "";

  /**
   * 2-tuple prop to render two secondary buttons for a 3 button modal.
   * Supersedes `secondaryButtonText`.
   * @type {[{ text: string; }, { text: string; }]}
   */
  export let secondaryButtons = [];

  /** Specify a selector to be focused when opening the modal */
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";

  /** Set to `true` to prevent the modal from closing when clicking outside */
  export let preventCloseOnClickOutside = false;

  /** Set an id for the top-level element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { afterUpdate, createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";
  import Button from "../Button/Button.svelte";
  import Close from "../icons/Close.svelte";
  import { initialFocus, restoreFocus } from "../utils/focus.js";
  import { createOutsideDismiss } from "../utils/outsideDismiss.js";
  import { trapFocus } from "../utils/trapFocus.js";
  import { trackModal } from "./modalStore";

  const dispatch = createEventDispatcher();
  const focusReturn = restoreFocus();

  let buttonRef = null;
  let primaryButtonRef = null;
  let innerModal = null;
  let opened = false;
  let closeDispatched = false;

  function focus(element) {
    const container = element || innerModal;
    const node = initialFocus({
      container,
      selectorPrimaryFocus,
      fallbacks: [
        danger ? container.querySelector(".bx--btn--secondary") : null,
        primaryButtonRef,
        buttonRef,
      ],
    });
    node?.focus();
  }

  function close(trigger) {
    closeDispatched = true;
    const shouldContinue = dispatch("close", { trigger }, { cancelable: true });
    if (shouldContinue) {
      open = false;
    } else {
      closeDispatched = false;
    }
  }

  const outsideDismiss = createOutsideDismiss(() => {
    if (!preventCloseOnClickOutside) close("outside-click");
  });

  const openStore = writable(open);
  $: $openStore = open;
  trackModal(openStore);

  setContext("carbon:Modal", {});

  afterUpdate(() => {
    if (opened) {
      if (!open) {
        opened = false;
        if (!closeDispatched) {
          dispatch("close", { trigger: "programmatic" });
        }
        closeDispatched = false;
      }
    } else if (open) {
      opened = true;
      focusReturn.save();
      focus();
      dispatch("open");
    }
  });

  $: modalLabelId = `bx--modal-header__label--modal-${id}`;
  $: modalHeadingId = `bx--modal-header__heading--modal-${id}`;
  $: modalBodyId = `bx--modal-body--${id}`;
  $: ariaLabel =
    modalLabel ?? $$props["aria-label"] ?? modalAriaLabel ?? modalHeading;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  bind:this={ref}
  role="presentation"
  {id}
  class:bx--modal={true}
  class:bx--modal-tall={!passiveModal}
  class:is-visible={open}
  class:bx--modal--danger={danger}
  inert={open ? undefined : true}
  {...$$restProps}
  on:keydown
  on:keydown={(event) => {
    if (open) {
      if (event.key === "Escape") {
        close("escape-key");
      } else if (event.key === "Tab") {
        trapFocus({ container: ref, event });
      } else if (
        shouldSubmitOnEnter &&
        event.key === "Enter" &&
        !primaryButtonDisabled
      ) {
        const target = event.target;
        const tag = target?.tagName;
        if (
          tag === "BUTTON" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target?.isContentEditable
        ) {
          // Let the focused button (e.g. the secondary/cancel button) handle
          // Enter via its native activation instead of submitting the form.
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
  on:mouseup={outsideDismiss.release}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:transitionend={(event) => {
    if (event.propertyName === "transform") {
      dispatch("transitionend", { open });
      if (!open) focusReturn.restore();
    }
  }}
>
  <div
    bind:this={innerModal}
    tabindex="-1"
    role={alert ? (passiveModal ? "alert" : "alertdialog") : "dialog"}
    aria-describedby={alert && !passiveModal ? modalBodyId : undefined}
    aria-modal="true"
    aria-label={ariaLabel}
    class:bx--modal-container={true}
    class:bx--modal-container--xs={size === "xs"}
    class:bx--modal-container--sm={size === "sm"}
    class:bx--modal-container--lg={size === "lg"}
    on:mousedown={outsideDismiss.pressInside}
  >
    <div class:bx--modal-header={true}>
      {#if passiveModal}
        <button
          bind:this={buttonRef}
          type="button"
          aria-label={iconDescription}
          class:bx--modal-close={true}
          on:click={() => {
            close("close-button");
          }}
        >
          <Close size={20} class="bx--modal-close__icon" aria-hidden="true" />
        </button>
      {/if}
      {#if modalLabel}
        <h2 id={modalLabelId} class:bx--modal-header__label={true}>
          <slot name="label">{modalLabel}</slot>
        </h2>
      {/if}
      <h3 id={modalHeadingId} class:bx--modal-header__heading={true}>
        <slot name="heading">{modalHeading}</slot>
      </h3>
      {#if !passiveModal}
        <button
          bind:this={buttonRef}
          type="button"
          aria-label={iconDescription}
          class:bx--modal-close={true}
          on:click={() => {
            close("close-button");
          }}
        >
          <Close size={20} class="bx--modal-close__icon" aria-hidden="true" />
        </button>
      {/if}
    </div>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
      id={modalBodyId}
      class:bx--modal-content={true}
      class:bx--modal-content--with-form={hasForm}
      class:bx--modal-scroll-content={hasScrollingContent}
      tabindex={hasScrollingContent ? "0" : undefined}
      role={hasScrollingContent ? "region" : undefined}
      aria-label={hasScrollingContent ? ariaLabel : undefined}
      aria-labelledby={modalLabel ? modalLabelId : modalHeadingId}
    >
      <slot />
    </div>
    {#if hasScrollingContent}
      <div class:bx--modal-content--overflow-indicator={true}></div>
    {/if}
    {#if !passiveModal}
      <div
        class:bx--modal-footer={true}
        class:bx--modal-footer--three-button={secondaryButtons.length === 2}
      >
        {#if secondaryButtons.length > 0}
          {#each secondaryButtons as button}
            <Button
              kind="secondary"
              on:click={() => {
                dispatch("click:button--secondary", { text: button.text });
              }}
            >
              {button.text}
            </Button>
          {/each}
        {:else if secondaryButtonText}
          <Button
            kind="secondary"
            on:click={() => {
              dispatch("click:button--secondary", {
                text: secondaryButtonText,
              });
            }}
          >
            {secondaryButtonText}
          </Button>
        {/if}
        <Button
          bind:ref={primaryButtonRef}
          kind={danger ? "danger" : "primary"}
          disabled={primaryButtonDisabled}
          icon={primaryButtonIcon}
          type={formId ? "submit" : "button"}
          form={formId}
          on:click={() => {
            dispatch("submit");
            dispatch("click:button--primary");
          }}
        >
          {primaryButtonText}
        </Button>
      </div>
    {/if}
  </div>
</div>
