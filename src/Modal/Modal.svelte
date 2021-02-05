<script>
  /**
   * @event {{ open: boolean; }} transitionend
   */

  /**
   * Set the size of the modal
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
   * Specify the modal heading
   * @type {string}
   */
  export let modalHeading = undefined;

  /**
   * Specify the modal label
   * @type {string}
   */
  export let modalLabel = undefined;

  /**
   * Specify the ARIA label for the modal
   * @type {string}
   */
  export let modalAriaLabel = undefined;

  /** Specify the ARIA label for the close icon */
  export let iconDescription = "Close the modal";

  /** Set to `true` if the modal contains form elements */
  export let hasForm = false;

  /** Set to `true` if the modal contains scrolling content */
  export let hasScrollingContent = false;

  /** Specify the primary button text */
  export let primaryButtonText = "";

  /** Set to `true` to disable the primary button */
  export let primaryButtonDisabled = false;

  /** Set to `true` for the primary button to be triggered when pressing "Enter" */
  export let shouldSubmitOnEnter = true;

  /** Specify the secondary button text */
  export let secondaryButtonText = "";

  /** Specify a selector to be focused when opening the modal */
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";

  /** Set to `true` to prevent the modal from closing when clicking outside */
  export let preventCloseOnClickOutside = false;

  /** Set an id for the top-level element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the top-level HTML element */
  export let ref = null;

  import { createEventDispatcher, onMount, afterUpdate } from "svelte";
  import Close20 from "carbon-icons-svelte/lib/Close20/Close20.svelte";
  import Button from "../Button/Button.svelte";

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
  on:mouseleave
  on:transitionend="{(e) => {
    if (e.propertyName === 'transform') {
      dispatch('transitionend', { open });
    }
  }}"
>
  <div
    bind:this="{innerModal}"
    role="dialog"
    tabindex="-1"
    {...alertDialogProps}
    aria-modal="true"
    aria-label="{ariaLabel}"
    class:bx--modal-container="{true}"
    class:bx--modal-container--xs="{size === 'xs'}"
    class:bx--modal-container--sm="{size === 'sm'}"
    class:bx--modal-container--lg="{size === 'lg'}"
    on:click="{() => {
      didClickInnerModal = true;
    }}"
  >
    <div class:bx--modal-header="{true}">
      {#if passiveModal}
        <button
          bind:this="{buttonRef}"
          type="button"
          aria-label="{iconDescription}"
          title="{iconDescription}"
          class:bx--modal-close="{true}"
          on:click="{() => {
            open = false;
          }}"
        >
          <Close20
            aria-label="{iconDescription}"
            class="bx--modal-close__icon"
          />
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
          }}"
        >
          <Close20
            aria-label="{iconDescription}"
            class="bx--modal-close__icon"
          />
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
      aria-labelledby="{modalLabel ? modalLabelId : modalHeadingId}"
    >
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
          }}"
        >
          {secondaryButtonText}
        </Button>
        <Button
          kind="{danger ? 'danger' : 'primary'}"
          disabled="{primaryButtonDisabled}"
          on:click="{() => {
            dispatch('submit');
          }}"
        >
          {primaryButtonText}
        </Button>
      </div>
    {/if}
  </div>
</div>
