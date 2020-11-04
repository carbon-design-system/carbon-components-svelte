<script>
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

  /** Specify a selector to be focused when opening the modal */
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";

  /**
   * Obtain a reference to the top-level HTML element
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import {
    createEventDispatcher,
    tick,
    setContext,
    onMount,
    afterUpdate,
    onDestroy,
  } from "svelte";

  const dispatch = createEventDispatcher();

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
  });

  function focus(element) {
    const node =
      (element || innerModal).querySelector(selectorPrimaryFocus) || buttonRef;
    if (node != null) node.focus();
  }

  $: opened = false;
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
  tabindex="-1"
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
  on:transitionend
  on:transitionend="{({ currentTarget }) => {
    if (didOpen) {
      focus(currentTarget);
      didOpen = false;
    }
  }}"
>
  <div
    bind:this="{innerModal}"
    class:bx--modal-container="{true}"
    class="{size && `bx--modal-container--${size}`} {containerClass}"
    on:click="{() => {
      didClickInnerModal = true;
    }}"
  >
    <slot />
  </div>
</div>
