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
  } from "svelte";
  import { writable } from "svelte/store";
  import { trackModal } from "../Modal/modalStore";

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
      dispatch("click:button--primary");
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
      (element || innerModal)?.querySelector(selectorPrimaryFocus) || buttonRef;
    if (node != null) node.focus();
  }

  let opened = false;
  $: didOpen = open;

  const openStore = writable(open);
  $: $openStore = open;
  trackModal(openStore);

  onMount(() => {
    tick().then(() => {
      focus();
    });
  });

  afterUpdate(() => {
    if (opened) {
      if (!open) {
        opened = false;
        dispatch("close");
      }
    } else if (open) {
      opened = true;
      dispatch("open");
    }
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  bind:this="{ref}"
  role="presentation"
  class:bx--modal="{true}"
  class:is-visible="{open}"
  class:bx--modal--danger="{danger}"
  {...$$restProps}
  on:keydown
  on:keydown="{(e) => {
    if (open) {
      if (e.key === 'Escape') {
        open = false;
      } else if (e.key === 'Tab') {
        // taken from github.com/carbon-design-system/carbon/packages/react/src/internal/keyboard/navigation.js
        const selectorTabbable = `
  a[href], area[href], input:not([disabled]):not([tabindex='-1']),
  button:not([disabled]):not([tabindex='-1']),select:not([disabled]):not([tabindex='-1']),
  textarea:not([disabled]):not([tabindex='-1']),
  iframe, object, embed, *[tabindex]:not([tabindex='-1']):not([disabled]), *[contenteditable=true]
`;

        const tabbable = Array.from(ref.querySelectorAll(selectorTabbable));

        let index = tabbable.indexOf(document.activeElement);
        if (index === -1 && e.shiftKey) index = 0;

        index += tabbable.length + (e.shiftKey ? -1 : 1);
        index %= tabbable.length;

        tabbable[index].focus();
        e.preventDefault();
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
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
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
