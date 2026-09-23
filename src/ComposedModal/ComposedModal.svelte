<script>
  /**
   * @event close
   * @property {"escape-key" | "outside-click" | "close-button" | "programmatic"} trigger
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

  /**
   * Set to `true` to enable alert mode.
   * The dialog uses `role="alertdialog"` and is described by `ModalBody`.
   */
  export let alert = false;

  /** Set to `true` to remove the modal body padding so content spans edge to edge */
  export let fullWidth = false;

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

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import { trackModal } from "../Modal/modal-store.js";
  import { initialFocus, restoreFocus } from "../utils/focus.js";
  import { createOutsideDismiss } from "../utils/outside-dismiss.js";
  import { trapFocus } from "../utils/trap-focus.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const label = writable(undefined);
  const title = writable(undefined);
  const bodyId = writable(undefined);
  const focusReturn = restoreFocus();

  // Ids for ModalHeader's label/title headings, so ModalBody (when
  // `hasScrollingContent`) can name its region via `aria-labelledby`.
  const modalId = uniqueId();
  const labelId = `${modalId}-label`;
  const titleId = `${modalId}-title`;

  let innerModalRef = null;
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

  const outsideDismiss = createOutsideDismiss(() => {
    if (!preventCloseOnClickOutside) close("outside-click");
  });

  /**
   * @type {() => void}
   */
  function closeModal() {
    close("close-button");
  }

  /**
   * @type {() => void}
   */
  function submit() {
    dispatch("submit");
    dispatch("click:button--primary");
  }

  /**
   * @type {(value: string | undefined) => void}
   */
  function updateLabel(value) {
    label.set(value);
  }

  /**
   * @type {(value: string | undefined) => void}
   */
  function updateTitle(value) {
    title.set(value);
  }

  /**
   * @type {(value: string | undefined) => void}
   */
  function setBodyId(value) {
    bodyId.set(value);
  }

  setContext("carbon:Modal", {});
  setContext("carbon:ComposedModal", {
    closeModal,
    submit,
    updateLabel,
    updateTitle,
    labelId,
    titleId,
    label,
    title,
    bodyId,
    setBodyId,
    defaultBodyId: `${modalId}-body`,
  });

  function focus(node) {
    const container = node || innerModalRef;
    const target = initialFocus({
      container,
      selectorPrimaryFocus,
      fallbacks: [
        danger
          ? container?.querySelector(".bx--btn--secondary")
          : container?.querySelector(".bx--btn--primary"),
        container?.querySelector(".bx--modal-close"),
      ],
    });
    target?.focus();
  }

  let prevOpen = false;
  let mounted = false;

  const sharedOpen = writable(open);
  $: $sharedOpen = open;
  trackModal(sharedOpen);

  onMount(() => {
    mounted = true;
    if (open) {
      tick().then(() => {
        if (open) focus();
      });
    }
  });

  $: {
    if (prevOpen) {
      if (!open) {
        prevOpen = false;
        if (!closeDispatched) {
          tick().then(() => {
            dispatch("close", { trigger: "programmatic" });
          });
        }
        closeDispatched = false;
      }
    } else if (open) {
      prevOpen = true;
      // Capture the opener before the DOM commits; activeElement is still
      // the element that opened the modal.
      focusReturn.save();
      dispatch("open");
      // onMount handles the initial mount; later opens need the committed DOM.
      if (mounted) {
        tick().then(() => {
          if (open) focus();
        });
      }
    }
  }
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
  aria-label={undefined}
  on:keydown
  on:keydown={(event) => {
    if (open) {
      if (event.key === "Escape") {
        // Stop stacked (DOM-nested) modals from also closing: this
        // handler is on each modal's own root and Escape bubbles from
        // the focused (innermost, topmost) modal up through ancestors.
        event.stopPropagation();
        close("escape-key");
      } else if (event.key === "Tab") {
        trapFocus({ container: ref, event });
      }
    }
  }}
  on:click
  on:mousedown={(event) => {
    if (event.target === event.currentTarget) outsideDismiss.pressOutside();
  }}
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
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    bind:this={innerModalRef}
    tabindex="-1"
    role={alert ? "alertdialog" : "dialog"}
    aria-describedby={alert ? $bodyId : undefined}
    aria-modal="true"
    aria-label={$$props["aria-label"] ?? ($label || $title || undefined)}
    class:bx--modal-container={true}
    class:bx--modal-container--xs={size === "xs"}
    class:bx--modal-container--sm={size === "sm"}
    class:bx--modal-container--lg={size === "lg"}
    class:bx--modal-container--full-width={fullWidth}
    class={containerClass}
    on:mousedown={outsideDismiss.pressInside}
  >
    <slot />
  </div>
</div>
