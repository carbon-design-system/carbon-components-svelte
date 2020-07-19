<script>
  export let size = undefined; // "xs" | "sm" | "lg"
  export let open = false;
  export let passiveModal = false;
  export let danger = false;
  export let hasForm = false;
  export let hasScrollingContent = false;
  export let primaryButtonDisabled = false;
  export let shouldSubmitOnEnter = true;
  export let modalAriaLabel = undefined;
  export let modalHeading = undefined;
  export let modalLabel = undefined;
  export let iconDescription = "Close the modal";
  export let primaryButtonText = "";
  export let secondaryButtonText = "";
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";
  export let id = "ccs-" + Math.random().toString(36);
  export let ref = null;

  import { createEventDispatcher, afterUpdate, onDestroy } from "svelte";
  import Close20 from "carbon-icons-svelte/lib/Close20";
  import { Button } from "../Button";

  const dispatch = createEventDispatcher();

  let buttonRef = null;
  let innerModal = null;
  let opened = false;

  function focus(element) {
    const node =
      (element || innerModal).querySelector(selectorPrimaryFocus) || buttonRef;
    node.focus();
  }

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

  onDestroy(() => {
    document.body.classList.remove("bx--body--with-modal-open");
  });

  $: modalLabelId = `bx--modal-header__label--modal-${id}`;
  $: modalHeadingId = `bx--modal-header__heading--modal-${id}`;
  $: ariaLabel =
    modalLabel || $$props["aria-label"] || modalAriaLabel || modalHeading;
</script>

<div
  bind:this={ref}
  role="presentation"
  tabindex="-1"
  {id}
  class:bx--modal={true}
  class:bx--modal-tall={!passiveModal}
  class:is-visible={open}
  class:bx--modal--danger={danger}
  {...$$restProps}
  on:keydown
  on:keydown={({ key }) => {
    if (open) {
      if (key === 'Escape') {
        open = false;
      } else if (shouldSubmitOnEnter && key === 'Enter') {
        dispatch('submit');
      }
    }
  }}
  on:click
  on:click={({ target }) => {
    if (!innerModal.contains(target)) {
      open = false;
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <div
    bind:this={innerModal}
    role="dialog"
    aria-modal="true"
    aria-label={ariaLabel}
    class:bx--modal-container={true}
    class={size && `bx--modal-container--${size}`}>
    <div class:bx--modal-header={true}>
      {#if passiveModal}
        <button
          bind:this={buttonRef}
          type="button"
          aria-label={iconDescription}
          title={iconDescription}
          class="bx--modal-close"
          on:click={() => {
            open = false;
          }}>
          <Close20 aria-label={iconDescription} class="bx--modal-close__icon" />
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
          title={iconDescription}
          class:bx--modal-close={true}
          on:click={() => {
            open = false;
          }}>
          <Close20 aria-label={iconDescription} class="bx--modal-close__icon" />
        </button>
      {/if}
    </div>
    <div
      class:bx--modal-content={true}
      class:bx--modal-content--with-form={hasForm}
      class:bx--modal-scroll-content={hasScrollingContent}
      tabindex={hasScrollingContent ? '0' : undefined}
      role={hasScrollingContent ? 'region' : undefined}
      aria-label={hasScrollingContent ? ariaLabel : undefined}
      aria-labelledby={modalLabel ? modalLabelId : modalHeadingId}>
      <slot />
    </div>
    {#if hasScrollingContent}
      <div class:bx--modal-content--overflow-indicator={true} />
    {/if}
    {#if !passiveModal}
      <div class:bx--modal-footer={true}>
        <Button
          kind="secondary"
          on:click={() => {
            dispatch('click:button--secondary');
          }}>
          {secondaryButtonText}
        </Button>
        <Button
          kind={danger ? 'danger' : 'primary'}
          disabled={primaryButtonDisabled}
          on:click={() => {
            dispatch('submit');
          }}>
          {primaryButtonText}
        </Button>
      </div>
    {/if}
  </div>
</div>
