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

  /**
   * Set to `true` to open the modal.
   * @bindable writable
   */
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

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   */
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
  import { initialFocus, restoreFocus } from "../utils/focus.js";
  import { trapFocus } from "../utils/trapFocus.js";

  const dispatch = createEventDispatcher();
  const label = writable(undefined);
  const focusReturn = restoreFocus();

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

  setContext("carbon:Modal", {});
  setContext("carbon:ComposedModal", {
    closeModal,
    submit,
    declareRef,
    updateLabel,
  });

  function focus(element) {
    const container = element || innerModal;
    const node = initialFocus({
      container,
      selectorPrimaryFocus,
      fallbacks: [
        danger
          ? container?.querySelector(".bx--btn--secondary")
          : container?.querySelector(".bx--btn--primary"),
        container?.querySelector(".bx--modal-close"),
      ],
    });
    node?.focus();
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
  on:keydown={(event) => {
    if (open) {
      if (event.key === "Escape") {
        close("escape-key");
      } else if (event.key === "Tab") {
        trapFocus({ container: ref, event });
      }
    }
  }}
  on:click
  on:mouseup={() => {
    if (!didClickInnerModal && !preventCloseOnClickOutside) {
      close("outside-click");
    }
    didClickInnerModal = false;
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:transitionend={(event) => {
    if (event.propertyName === "transform") {
      dispatch("transitionend", { open });
      if (!open) focusReturn.restore();
    }

    if (didOpen) {
      focusReturn.save();
      focus(event.currentTarget);
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
    on:mousedown={() => {
      didClickInnerModal = true;
    }}
  >
    <slot />
  </div>
</div>
