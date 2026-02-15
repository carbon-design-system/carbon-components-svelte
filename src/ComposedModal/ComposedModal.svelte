<script>
  /**
   * @event close
   * @property {"escape-key" | "outside-click" | "close-button"} trigger
   * @event transitionend
   * @property {boolean} open
   */

  /**
   * Set the size of the composed modal.
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
   * Specify a selector to be focused when opening the modal.
   * @type {null | string}
   */
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";

  /** Obtain a reference to the top-level HTML element */
  export let ref = null;

  import {
    afterUpdate,
    createEventDispatcher,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { writable } from "svelte/store";
  import { trackModal } from "../Modal/modalStore";

  const dispatch = createEventDispatcher();
  const label = writable(undefined);

  let buttonRef = null;
  let innerModal = null;
  let didClickInnerModal = false;
  let closeDispatched = false;

  function close(trigger) {
    closeDispatched = true;
    const shouldContinue = dispatch("close", { trigger }, { cancelable: true });
    if (shouldContinue) {
      open = false;
    } else {
      closeDispatched = false;
    }
  }

  /**
   * @type {() => void}
   */
  const closeModal = () => {
    close("close-button");
  };

  /**
   * @type {() => void}
   */
  const submit = () => {
    dispatch("submit");
    dispatch("click:button--primary");
  };

  /**
   * @type {(ref: HTMLButtonElement) => void}
   */
  const declareRef = (ref) => {
    buttonRef = ref;
  };

  /**
   * @type {(value: string | undefined) => void}
   */
  const updateLabel = (value) => {
    label.set(value);
  };

  setContext("Modal", {});
  setContext("ComposedModal", {
    closeModal,
    submit,
    declareRef,
    updateLabel,
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
        if (!closeDispatched) {
          dispatch("close");
        }
        closeDispatched = false;
      }
    } else if (open) {
      opened = true;
      dispatch("open");
    }
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  bind:this={ref}
  role="presentation"
  class:bx--modal={true}
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
  on:transitionend={({ propertyName, currentTarget }) => {
    if (propertyName === "transform") {
      dispatch("transitionend", { open });
    }

    if (didOpen) {
      focus(currentTarget);
      didOpen = false;
    }
  }}
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    bind:this={innerModal}
    role="dialog"
    aria-modal="true"
    aria-label={$$props["aria-label"] ?? $label ?? undefined}
    class:bx--modal-container={true}
    class:bx--modal-container--xs={size === "xs"}
    class:bx--modal-container--sm={size === "sm"}
    class:bx--modal-container--lg={size === "lg"}
    class={containerClass}
    on:click={() => {
      didClickInnerModal = true;
    }}
  >
    <slot />
  </div>
</div>
