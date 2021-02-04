<script>
  /**
   * @event {{ open: boolean; }} transitionend
   */

  /**
   * Set the size of the composed modal
   * @type {"xs" | "sm" | "lg"}
   */
  export let size = undefined;

  /** Set to `true` to open the modal */
  export let open = false;

  /** Set to `true` to use the danger variant */
  export let danger = false;

  /** Set to `true` to prevent the modal from closing when clicking outside */
  export let preventCloseOnClickOutside = false;

  /** Specify a class for the inner modal */
  export let containerClass = "";

  /**
   * Specify a selector to be focused when opening the modal
   * @type {null | string}
   */
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";

  /** Obtain a reference to the top-level HTML element */
  export let ref = null;

  import {
    createEventDispatcher,
    tick,
    setContext,
    onMount,
    afterUpdate,
    onDestroy,
  } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  const label = writable(undefined);

  let buttonRef = null;
  let innerModal = null;
  let didClickInnerModal = false;

  setContext("ComposedModal", {
    closeModal: () => {
      open = false;
    },
    submit: () => {
      dispatch("submit");
    },
    declareRef: (ref) => {
      buttonRef = ref;
    },
    updateLabel: (value) => {
      label.set(value);
    },
  });

  function focus(element) {
    if (selectorPrimaryFocus == null) return;
    const node =
      (element || innerModal).querySelector(selectorPrimaryFocus) || buttonRef;
    if (node != null) node.focus();
  }

  let opened = false;
  $: didOpen = open;

  onMount(async () => {
    await tick();
    focus();
  });

  onDestroy(() => {
    document.body.classList.remove("bx--body--with-modal-open");
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
      dispatch("open");
      document.body.classList.add("bx--body--with-modal-open");
    }
  });
</script>

<div
  bind:this="{ref}"
  role="presentation"
  class:bx--modal="{true}"
  class:is-visible="{open}"
  class:bx--modal--danger="{danger}"
  {...$$restProps}
  on:click
  on:click="{() => {
    if (!didClickInnerModal && !preventCloseOnClickOutside) open = false;
    didClickInnerModal = false;
  }}"
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:transitionend="{({ propertyName, currentTarget }) => {
    if (propertyName === 'transform') {
      dispatch('transitionend', { open });
    }

    if (didOpen) {
      focus(currentTarget);
      didOpen = false;
    }
  }}"
>
  <div
    bind:this="{innerModal}"
    role="dialog"
    aria-modal="true"
    aria-label="{$$props['aria-label'] || $label || undefined}"
    class:bx--modal-container="{true}"
    class:bx--modal-container--xs="{size === 'xs'}"
    class:bx--modal-container--sm="{size === 'sm'}"
    class:bx--modal-container--lg="{size === 'lg'}"
    class="{containerClass}"
    on:click="{() => {
      didClickInnerModal = true;
    }}"
  >
    <slot />
  </div>
</div>
