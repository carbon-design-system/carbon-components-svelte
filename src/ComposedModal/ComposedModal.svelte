<script>
  /**
   * @event close
   * @property {"escape-key" | "outside-click" | "close-button" | "programmatic"} trigger
   * @event {null} open
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

  /**
   * Set an id for the top-level element.
   * The header label, header title, and body ids derive from it as
   * `{id}-label`, `{id}-title`, and `{id}-body`.
   */
  export let id = uniqueId();

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { derived, writable } from "svelte/store";
  import { MODAL_CONTEXT_KEY } from "../constants/context-keys.js";
  import { trackModal } from "../Modal/modal-store.js";
  import { createDialogLifecycle } from "../utils/dialog-lifecycle.js";
  import { initialFocus, restoreFocus } from "../utils/focus.js";
  import { trapFocus } from "../utils/trap-focus.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const label = writable(undefined);
  const title = writable(undefined);
  const bodyId = writable(undefined);
  const focusReturn = restoreFocus();

  // Ids for ModalHeader's label/title headings, so ModalBody (when
  // `hasScrollingContent`) can name its region via `aria-labelledby`.
  const modalId = writable(id);
  $: modalId.set(id);
  const ids = derived(modalId, (value) => ({
    label: `${value}-label`,
    title: `${value}-title`,
    body: `${value}-body`,
  }));

  let innerModalRef = null;
  let mounted = false;

  const lifecycle = createDialogLifecycle({
    dispatch,
    setOpen: (value) => {
      open = value;
    },
    preventCloseOnClickOutside: () => preventCloseOnClickOutside,
    saveFocusReturn: focusReturn.save,
    focus: () => focus(),
    getOpen: () => open,
  });
  const { close, outsideDismiss } = lifecycle;

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

  setContext(MODAL_CONTEXT_KEY, {});
  setContext("carbon:ComposedModal", {
    closeModal,
    submit,
    updateLabel,
    updateTitle,
    ids,
    label,
    title,
    bodyId,
    setBodyId,
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

  const sharedOpen = writable(open);
  $: $sharedOpen = open;
  trackModal(sharedOpen);

  // Name the dialog from ModalHeader's label/title. The header registers
  // them after this element is serialized, so on the server (and the first
  // client render) point at its heading ids instead. An id with no element
  // is ignored; once mounted with no heading, there is nothing to point at.
  // The server cannot tell which headings the header renders, so it names the
  // dialog from both ("Label Title"); after mount the name is `$label || $title`
  // (the label alone when both are set). The name is a superset until then.
  $: consumerLabel = $$props["aria-label"];
  $: consumerLabelledby = $$props["aria-labelledby"];
  $: ariaLabel =
    consumerLabel ??
    (consumerLabelledby === undefined
      ? $label || $title || undefined
      : undefined);
  $: ariaLabelledby =
    consumerLabelledby ??
    (consumerLabel === undefined && !mounted && !$label && !$title
      ? `${$ids.label} ${$ids.title}`
      : undefined);

  onMount(() => {
    mounted = true;
    lifecycle.setMounted();
    if (open) {
      tick().then(() => {
        if (open) focus();
      });
    }
  });

  $: lifecycle.syncOpen(open);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  bind:this={ref}
  role="presentation"
  class:bx--modal={true}
  class:is-visible={open}
  class:bx--modal--danger={danger}
  inert={open ? undefined : true}
  {id}
  {...$$restProps}
  aria-label={undefined}
  aria-labelledby={undefined}
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
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledby}
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
