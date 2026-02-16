<script>
  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "close-button"} trigger
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

  /** Set to `true` to open the modal */
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
   * @type {any}
   */
  export let primaryButtonIcon = undefined;

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

  /** Obtain a reference to the top-level HTML element */
  export let ref = null;

  import { afterUpdate, createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";
  import Button from "../Button/Button.svelte";
  import Close from "../icons/Close.svelte";
  import { trackModal } from "./modalStore";

  const dispatch = createEventDispatcher();

  let buttonRef = null;
  let primaryButtonRef = null;
  let innerModal = null;
  let opened = false;
  let didClickInnerModal = false;
  let closeDispatched = false;
  let previouslyFocusedElement = null;

  function focus(element) {
    const container = element || innerModal;
    /**
     * First, use the selectorPrimaryFocus to find the element.
     * Otherwise, use the primary button and fallback to the close button.
     */
    const node =
      container.querySelector(selectorPrimaryFocus) ||
      primaryButtonRef ||
      buttonRef;
    node.focus();
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

  const openStore = writable(open);
  $: $openStore = open;
  trackModal(openStore);

  setContext("carbon:Modal", {});

  afterUpdate(() => {
    if (opened) {
      if (!open) {
        opened = false;
        if (!closeDispatched) {
          dispatch("close");
        }
        closeDispatched = false;
      }
    } else if (open) {
      opened = true;
      previouslyFocusedElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
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
  on:keydown={(e) => {
    if (open) {
      if (e.key === "Escape") {
        close("escape-key");
      } else if (e.key === "Tab") {
        // trap focus

        // taken from github.com/carbon-design-system/carbon/packages/react/src/internal/keyboard/navigation.js
        const selectorTabbable = `
  a[href], area[href], input:not([disabled]):not([tabindex='-1']),
  button:not([disabled]):not([tabindex='-1']),select:not([disabled]):not([tabindex='-1']),
  textarea:not([disabled]):not([tabindex='-1']),
  iframe, object, embed, *[tabindex]:not([tabindex='-1']):not([disabled]), *[contenteditable=true]
`;

        const tabbable = Array.from(
          ref.querySelectorAll(selectorTabbable)
        ).filter((el) => {
          // Filter out elements that are not visible.
          const style = getComputedStyle(el);
          if (style.visibility === "hidden" || style.display === "none") {
            return false;
          }

          // Check for zero dimensions, but only if the element has been laid out
          // (offsetParent is null for hidden elements or elements not in the DOM.
          if (
            el.offsetParent !== null &&
            el.offsetWidth === 0 &&
            el.offsetHeight === 0
          ) {
            return false;
          }
          
          return true;
        });

        if (tabbable.length === 0) {
          e.preventDefault();
          return;
        }

        let index = tabbable.indexOf(document.activeElement);
        if (index === -1) {
          // Active element not in tabbable list, find closest tabbable element
          // For forward Tab, start from beginning (-1 + 1 = 0)
          // For Shift+Tab, start from end (length + -1 = length - 1)
          index = e.shiftKey ? tabbable.length : -1;
        }

        index += e.shiftKey ? -1 : 1;
        index = (index + tabbable.length) % tabbable.length;

        tabbable[index].focus();
        e.preventDefault();
      } else if (
        shouldSubmitOnEnter &&
        e.key === "Enter" &&
        !primaryButtonDisabled
      ) {
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
  on:click={() => {
    if (!didClickInnerModal && !preventCloseOnClickOutside) {
      close("outside-click");
    }
    didClickInnerModal = false;
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:transitionend={(e) => {
    if (e.propertyName === "transform") {
      dispatch("transitionend", { open });
      if (!open && previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
        previouslyFocusedElement = null;
      }
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
    on:click={() => {
      didClickInnerModal = true;
    }}
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
