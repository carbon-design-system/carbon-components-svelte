<script>
  /**
   * Set the size of the modal
   * @type {"xs" | "sm" | "lg"} [size]
   */
  export let size = undefined;

  /**
   * Set to `true` to open the modal
   * @type {boolean} [open=false]
   */
  export let open = false;

  /**
   * Set to `true` to use the danger variant
   * @type {boolean} [danger=false]
   */
  export let danger = false;

  /**
   * Set to `true` to enable alert mode
   * @type {boolean} [alert=false]
   */
  export let alert = false;

  /**
   * Set to `true` to use the passive variant
   * @type {boolean} [passiveModal=false]
   */
  export let passiveModal = false;

  /**
   * Specify the modal heading
   * @type {string} [modalHeading]
   */
  export let modalHeading = undefined;

  /**
   * Specify the modal label
   * @type {string} [modalLabel]
   */
  export let modalLabel = undefined;

  /**
   * Specify the ARIA label for the modal
   * @type {string} [modalAriaLabel]
   */
  export let modalAriaLabel = undefined;

  /**
   * Specify the ARIA label for the close icon
   * @type {string} [iconDescription="Close the modal"]
   */
  export let iconDescription = "Close the modal";

  /**
   * Set to `true` if the modal contains form elements
   * @type {boolean} [hasForm=false]
   */
  export let hasForm = false;

  /**
   * Set to `true` if the modal contains scrolling content
   * @type {boolean} [hasScrollingContent=false]
   */
  export let hasScrollingContent = false;

  /**
   * Specify the primary button text
   * @type {string} [primaryButtonText=""]
   */
  export let primaryButtonText = "";

  /**
   * Set to `true` to disable the primary button
   * @type {boolean} [primaryButtonDisabled=false]
   */
  export let primaryButtonDisabled = false;

  /**
   * Set to `true` for the primary button to be triggered when pressing "Enter"
   * @type {boolean} [shouldSubmitOnEnter=true]
   */
  export let shouldSubmitOnEnter = true;

  /**
   * Specify the secondary button text
   * @type {string} [secondaryButtonText=""]
   */
  export let secondaryButtonText = "";

  /**
   * Specify a selector to be focused when opening the modal
   * @type {string} [selectorPrimaryFocus="[data-modal-primary-focus]"]
   */
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";

  /**
   * Set to `true` to prevent the modal from closing when clicking outside
   * @type {boolean} [preventCloseOnClickOutside=false]
   */
  export let preventCloseOnClickOutside = false;

  /**
   * Set an id for the top-level element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Obtain a reference to the top-level HTML element
   * @type {null | HTMLElement} [ref=null]
   */
  export let ref = null;

  import { createEventDispatcher, onMount, afterUpdate } from "svelte";
  import Close20 from "carbon-icons-svelte/lib/Close20";
  import { Button } from "../Button";

  const dispatch = createEventDispatcher();

  let buttonRef = null;
  let innerModal = null;
  let opened = false;
  let didClickInnerModal = false;

  function focus(element) {
    const node =
      (element || innerModal).querySelector(selectorPrimaryFocus) || buttonRef;
    node.focus();
  }

  onMount(() => {
    return () => {
      document.body.classList.remove("bx--body--with-modal-open");
    };
  });

  afterUpdate(() => {
    if (opened) {
      if (!open) {
        opened = false;
        dispatch("close");
        document.body.classList.remove("bx--body--with-modal-open");
      }
    } else if (open) {
      opened = true;
      focus();
      dispatch("open");
      document.body.classList.add("bx--body--with-modal-open");
    }
  });

  $: modalLabelId = `bx--modal-header__label--modal-${id}`;
  $: modalHeadingId = `bx--modal-header__heading--modal-${id}`;
  $: modalBodyId = `bx--modal-body--${id}`;
  $: ariaLabel =
    modalLabel || $$props["aria-label"] || modalAriaLabel || modalHeading;

  let alertDialogProps = {};
  $: if (alert) {
    if (passiveModal) {
      alertDialogProps.role = "alert";
    }
    if (!passiveModal) {
      alertDialogProps.role = "alertdialog";
      alertDialogProps["aria-describedby"] = modalBodyId;
    }
  }
</script>

<div
  bind:this="{ref}"
  role="presentation"
  tabindex="-1"
  id="{id}"
  class:bx--modal="{true}"
  class:bx--modal-tall="{!passiveModal}"
  class:is-visible="{open}"
  class:bx--modal--danger="{danger}"
  {...$$restProps}
  on:keydown
  on:keydown="{({ key }) => {
    if (open) {
      if (key === 'Escape') {
        open = false;
      } else if (shouldSubmitOnEnter && key === 'Enter') {
        dispatch('submit');
      }
    }
  }}"
  on:click
  on:click="{() => {
    if (!didClickInnerModal && !preventCloseOnClickOutside) open = false;
    didClickInnerModal = false;
  }}"
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <div
    bind:this="{innerModal}"
    role="dialog"
    {...alertDialogProps}
    aria-modal="true"
    aria-label="{ariaLabel}"
    class:bx--modal-container="{true}"
    class="{size && `bx--modal-container--${size}`}"
    on:click="{() => {
      didClickInnerModal = true;
    }}">
    <div class:bx--modal-header="{true}">
      {#if passiveModal}
        <button
          bind:this="{buttonRef}"
          type="button"
          aria-label="{iconDescription}"
          title="{iconDescription}"
          class="bx--modal-close"
          on:click="{() => {
            open = false;
          }}">
          <Close20
            aria-label="{iconDescription}"
            class="bx--modal-close__icon" />
        </button>
      {/if}
      {#if modalLabel}
        <h2 id="{modalLabelId}" class:bx--modal-header__label="{true}">
          <slot name="label">{modalLabel}</slot>
        </h2>
      {/if}
      <h3 id="{modalHeadingId}" class:bx--modal-header__heading="{true}">
        <slot name="heading">{modalHeading}</slot>
      </h3>
      {#if !passiveModal}
        <button
          bind:this="{buttonRef}"
          type="button"
          aria-label="{iconDescription}"
          title="{iconDescription}"
          class:bx--modal-close="{true}"
          on:click="{() => {
            open = false;
          }}">
          <Close20
            aria-label="{iconDescription}"
            class="bx--modal-close__icon" />
        </button>
      {/if}
    </div>
    <div
      id="{modalBodyId}"
      class:bx--modal-content="{true}"
      class:bx--modal-content--with-form="{hasForm}"
      class:bx--modal-scroll-content="{hasScrollingContent}"
      tabindex="{hasScrollingContent ? '0' : undefined}"
      role="{hasScrollingContent ? 'region' : undefined}"
      aria-label="{hasScrollingContent ? ariaLabel : undefined}"
      aria-labelledby="{modalLabel ? modalLabelId : modalHeadingId}">
      <slot />
    </div>
    {#if hasScrollingContent}
      <div class:bx--modal-content--overflow-indicator="{true}"></div>
    {/if}
    {#if !passiveModal}
      <div class:bx--modal-footer="{true}">
        <Button
          kind="secondary"
          on:click="{() => {
            dispatch('click:button--secondary');
          }}">
          {secondaryButtonText}
        </Button>
        <Button
          kind="{danger ? 'danger' : 'primary'}"
          disabled="{primaryButtonDisabled}"
          on:click="{() => {
            dispatch('submit');
          }}">
          {primaryButtonText}
        </Button>
      </div>
    {/if}
  </div>
</div>
