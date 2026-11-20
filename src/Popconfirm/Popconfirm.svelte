<script>
  /**
   * @slot {{ open: boolean; toggle: () => void }}
   * @slot {{}} descriptionChildren - Custom markup for the description. `description` is the fallback.
   * @event {null} open
   * @event {null} close
   * @event confirm
   * @event {{ error: unknown }} confirm:error
   */

  /**
   * @event cancel
   * @type {object}
   * @property {"cancel-button" | "escape-key" | "outside-click" | "trigger"} trigger
   */

  /**
   * Set to `true` to open the popconfirm.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the question the popconfirm asks. It names the dialog.
   * @type {string}
   */
  export let title;

  /**
   * Specify the supporting text under the title.
   * Alternatively, use the "descriptionChildren" slot.
   */
  export let description = "";

  /**
   * Set the kind of confirmation.
   * `"danger"` styles the confirm button as destructive and `"warning"` adds
   * a warning icon next to the title; both are announced as an alert dialog.
   * `"info"` is a plain dialog.
   * @type {"danger" | "warning" | "info"}
   */
  export let kind = "danger";

  /** Specify the confirm button text */
  export let confirmText = "Confirm";

  /** Specify the cancel button text */
  export let cancelText = "Cancel";

  /**
   * Specify the work to run on confirm. When it returns a promise, the
   * confirm button shows its loading state until the promise settles: the
   * popconfirm closes on success, and on failure stays open, shows
   * `errorText` and dispatches `confirm:error`.
   * Without it, or when it returns nothing, the popconfirm closes on confirm.
   * @type {undefined | (() => void | Promise<unknown>)}
   */
  export let confirm = undefined;

  /**
   * Set to `true` to show a loading state on the confirm button and block
   * closing, for work the app tracks itself. `confirm` sets this state on
   * its own.
   */
  export let loading = false;

  /** Specify the description for the confirm button loading state */
  export let loadingDescription = "Working";

  /**
   * Specify the message shown when `confirm` fails: a string, or a function
   * of the error it threw.
   * @type {string | ((error: unknown) => string)}
   */
  export let errorText = "Something went wrong. Try again.";

  /**
   * Specify the button that takes focus when the popconfirm opens.
   * Left unset, a `"danger"` or `"warning"` confirmation focuses cancel, so
   * a stray Enter or Space does not confirm, and an `"info"` one focuses
   * confirm.
   * @type {"cancel" | "confirm" | undefined}
   */
  export let initialFocus = undefined;

  /**
   * Set the preferred direction of the popconfirm relative to the trigger.
   * It flips to the opposite direction when there is not enough room.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let direction = "bottom";

  /**
   * Set the alignment of the popconfirm relative to the trigger.
   * Above and below the trigger, `start` and `end` name inline sides, so
   * they swap under `dir="rtl"`.
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  /**
   * Set to `true` to always render the popconfirm in a portal, or `false` to
   * keep it in place. Left unset, it moves to a portal inside a `Modal`, or
   * when a box around it (`overflow` other than `visible`, such as a
   * `DataTable`'s scroll area) would cut it off.
   * @type {boolean | undefined}
   */
  export let portalPopover = undefined;

  /**
   * Set an id for the popconfirm element.
   * The dialog id derives from it as `{id}-dialog`.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the dialog element.
   * In a portal, this is the portalled element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Popover from "../Popover/Popover.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import { MODAL_CONTEXT_KEY } from "../constants/context-keys.js";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { dismiss } from "../utils/dismiss.js";
  import { createOpenCloseDispatcher } from "../utils/dispatch-open-close.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { focusQuietly } from "../utils/focus.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import { noop } from "../utils/noop.js";
  import { trapFocus } from "../utils/trap-focus.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const notifyOpenChange = createOpenCloseDispatcher(dispatch);
  const insideModal = getContext(MODAL_CONTEXT_KEY);

  /** @type {null | HTMLSpanElement} */
  let rootRef = null;
  /** The button or link in the trigger slot that gets the ARIA wiring. */
  /** @type {null | HTMLElement} */
  let triggerRef = null;
  /** @type {null | HTMLButtonElement} */
  let cancelRef = null;
  /** @type {null | HTMLButtonElement} */
  let confirmRef = null;
  let disconnectModalObserver = noop;

  /** Whether a `confirm` promise is in flight. */
  let pending = false;
  /** Counts opens, so work from an earlier opening can't close a later one. */
  let session = 0;
  /** The message for a failed `confirm`, or `""`. */
  let errorMessage = "";
  let prevOpen = open;
  let mounted = false;
  // Set when a close should leave focus where the user put it.
  let keepFocus = false;

  $: dialogId = `${id}-dialog`;
  $: titleId = `${id}-title`;
  $: descriptionId = `${id}-description`;
  $: busy = loading || pending;
  $: alert = kind !== "info";
  $: hasDescription = !!description || !!$$slots.descriptionChildren;
  $: focusTarget = initialFocus ?? (kind === "info" ? "confirm" : "cancel");

  // Naming and description belong on the dialog. The title names it and the
  // description describes it, and a consumer's own wins or joins them. A
  // `class` joins the popover's own: in Svelte 3 and 4 a `class` in the rest
  // props would replace a static one.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: { class: restClass, ...dialogProps },
  } = splitAriaNaming($$restProps));

  // Left unset, a popconfirm in a `Modal` portals, as Toggletip does: the
  // modal's scroll area would cut it off. Popover also portals it when a
  // box around it would.
  $: effectivePortal = portalPopover ?? (insideModal ? true : undefined);

  // The v11 placement: above and below, `start` and `end` are inline sides,
  // so Popover swaps them in RTL and fits them to the window.
  /** @type {import("../Popover/Popover.svelte").PopoverProps["align"]} */
  $: popoverAlign =
    align === "center"
      ? direction
      : /** @type {`${typeof direction}-${typeof align}`} */ (
          `${direction}-${align}`
        );

  // The trigger is whatever button or link the slot renders. It gets the
  // ARIA of a button that opens a dialog, so any trigger works with no
  // wiring from the app.
  /**
   * @param {HTMLElement} node
   * @param {{ open: boolean, controls: string }} params
   */
  function triggerAria(node, params) {
    /** @param {{ open: boolean, controls: string }} next */
    function apply(next) {
      const found = /** @type {null | HTMLElement} */ (
        node.querySelector("button, a[href], [role='button'], [tabindex]")
      );
      triggerRef = found;
      if (!found) return;
      found.setAttribute("aria-haspopup", "dialog");
      found.setAttribute("aria-expanded", String(next.open));
      if (next.open) found.setAttribute("aria-controls", next.controls);
      else found.removeAttribute("aria-controls");
    }
    apply(params);
    return { update: apply };
  }

  /** @param {"cancel-button" | "escape-key" | "outside-click" | "trigger"} trigger */
  function cancel(trigger) {
    if (busy) return;
    dispatch("cancel", { trigger });
    keepFocus = trigger === "outside-click";
    open = false;
  }

  function toggle() {
    if (open) cancel("trigger");
    else open = true;
  }

  /** @param {MouseEvent} event */
  function handleTriggerClick(event) {
    // In place, clicks in the popconfirm bubble through the same wrapper.
    if (
      event.defaultPrevented ||
      ref?.contains(/** @type {Node} */ (event.target))
    )
      return;
    toggle();
  }

  // Escape is taken on `window` in the capture phase, ahead of the widgets
  // around the popconfirm: focus may sit on the trigger, in a portal, or
  // nowhere, and a `Modal` around it closes on the same key in the bubble
  // phase. A hovered trigger's tooltip also takes Escape in the capture
  // phase, and both close on the one key. This is the topmost layer open.
  /** @param {Event} event */
  function handleEscape(event) {
    const key = /** @type {KeyboardEvent} */ (event);
    if (!open || key.key !== "Escape") return;
    // Escape that cancels an IME composition is not a close.
    if (isImeComposition(key)) return;
    key.stopPropagation();
    cancel("escape-key");
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (!open || event.defaultPrevented) return;
    if (event.key === "Tab" && ref) {
      // Leaving the popconfirm by keyboard would strand it open, and in a
      // portal its place in the tab order is the end of the page.
      trapFocus({ container: ref, event });
    }
  }

  /** @param {Event} event */
  function handleOutsideClick(event) {
    if (open && isOutsideClick(event, [rootRef, ref])) cancel("outside-click");
  }

  async function handleConfirm() {
    // A second click while the first is still running is ignored.
    if (busy) return;
    dispatch("confirm");
    const current = session;
    errorMessage = "";
    let result;
    try {
      result = confirm?.();
    } catch (error) {
      fail(error);
      return;
    }
    if (
      typeof (
        /** @type {PromiseLike<unknown> | undefined} */ (result)?.then
      ) !== "function"
    ) {
      open = false;
      return;
    }
    pending = true;
    try {
      await result;
      if (current === session) open = false;
    } catch (error) {
      if (current === session) fail(error);
    } finally {
      if (current === session) pending = false;
    }
  }

  /** @param {unknown} error */
  function fail(error) {
    errorMessage =
      typeof errorText === "function" ? errorText(error) : errorText;
    dispatch("confirm:error", { error });
  }

  function focusTrigger() {
    if (triggerRef?.isConnected) focusQuietly(triggerRef);
  }

  $: if (open !== prevOpen) {
    prevOpen = open;
    if (open) {
      session += 1;
      // The earlier opening's confirm is now ignored, so it can't clear this.
      pending = false;
      errorMessage = "";
      keepFocus = false;
      if (mounted) tick().then(focusInside);
    } else {
      // Focus in the popconfirm, or dropped to the page by it closing, goes
      // back to the trigger. A click elsewhere keeps the focus it made.
      const active = document.activeElement;
      if (!keepFocus && (active === document.body || ref?.contains(active))) {
        focusTrigger();
      }
    }
  }

  // Cancel turns off while the work runs. Focus it held moves to confirm,
  // which stays focusable while it loads, so Escape keeps its place.
  $: if (busy && open) {
    tick().then(() => {
      const active = document.activeElement;
      if (active === document.body || active === cancelRef) confirmRef?.focus();
    });
  }

  function focusInside() {
    if (!open) return;
    const target = focusTarget === "confirm" ? confirmRef : cancelRef;
    // `preventScroll`: a portal places the box a frame later, so until then
    // it sits wherever the end of the page is.
    if (target) focusQuietly(target, { preventScroll: true });
  }

  // Close when an ancestor modal closes so the portalled content does not
  // linger.
  $: {
    disconnectModalObserver();
    disconnectModalObserver =
      effectivePortal && triggerRef
        ? observeModalClose(triggerRef, () => (open = false))
        : noop;
  }

  $: notifyOpenChange(open);

  onMount(() => {
    mounted = true;
    return () => disconnectModalObserver();
  });
</script>

<!-- Keys from the trigger and from the popconfirm in place both reach this
wrapper; the content's own handler covers a portal. -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
  bind:this={rootRef}
  {id}
  class:bx--popconfirm={true}
  class:bx--popconfirm--open={open}
  use:dismiss={{
    enabled: open,
    listeners: [
      { type: "click", handler: handleOutsideClick },
      { type: "keydown", handler: handleEscape, options: { capture: true } },
    ],
  }}
  on:keydown={handleKeydown}
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <span
    class:bx--popconfirm__trigger={true}
    use:triggerAria={{ open, controls: dialogId }}
    on:click={handleTriggerClick}
  >
    <slot {open} {toggle} />
  </span>
  <Popover
    bind:ref
    {open}
    align={popoverAlign}
    portalPopover={effectivePortal}
    caret
    border
    {...dialogProps}
    id={dialogId}
    role={alert ? "alertdialog" : "dialog"}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabel ? undefined : (ariaLabelledBy ?? titleId)}
    aria-describedby={joinDescribedBy(
      hasDescription ? descriptionId : undefined,
      ariaDescribedBy,
    )}
    class={["bx--popconfirm__popover", restClass].filter(Boolean).join(" ")}
  >
    <!-- In a portal, the content is outside the wrapper's listeners. -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class:bx--popconfirm__content={true} on:keydown={handleKeydown}>
      <div id={titleId} class:bx--popconfirm__title={true}>
        {#if kind === "warning"}
          <WarningAltFilled
            size={16}
            class="bx--popconfirm__title-icon"
            aria-hidden="true"
          />
        {/if}
        {title}
      </div>
      {#if hasDescription}
        <div id={descriptionId} class:bx--popconfirm__description={true}>
          <slot name="descriptionChildren">{description}</slot>
        </div>
      {/if}
      {#if errorMessage}
        <div role="alert" class:bx--popconfirm__error={true}>
          <ErrorFilled size={16} aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      {/if}
      <div class:bx--popconfirm__actions={true}>
        <Button
          bind:ref={cancelRef}
          size="sm"
          kind="ghost"
          disabled={busy}
          on:click={() => cancel("cancel-button")}
        >
          {cancelText}
        </Button>
        <Button
          bind:ref={confirmRef}
          size="sm"
          kind={kind === "danger" ? "danger" : "primary"}
          loading={busy}
          {loadingDescription}
          on:click={handleConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </div>
  </Popover>
</span>
