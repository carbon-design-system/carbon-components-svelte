<script>
  /**
   * @typedef {"outside-click" | "escape-key" | "close-button" | "target" | "action" | "programmatic"} CoachmarkCloseTrigger
   */

  /**
   * @restProps {span}
   * @event {null} open
   * @event {{ trigger: CoachmarkCloseTrigger }} close
   * @slot {{ close: () => void }} - The coachmark body. Call `close` to dismiss it and return focus to the target.
   * @slot {{ open: boolean; toggle: () => void; triggerProps: { id: string; "aria-haspopup": "dialog"; "aria-expanded": boolean; "aria-controls": string } }} target - The element that opens the coachmark. Spread `triggerProps` on it and call `toggle` on click. Defaults to a `CoachmarkBeacon`.
   * @slot {{}} title - A rich heading. Overrides `title`.
   * @slot {{ close: () => void }} actions - Buttons in the footer.
   */

  /**
   * Set to `true` to display the coachmark.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the heading. It names the dialog.
   * Alternatively, use the "title" slot.
   */
  export let title = "";

  /**
   * Set the placement of the coachmark relative to its target.
   * Prefer the v11 names (`"bottom-start"`). It stays in view: near a
   * window edge, or the edge of a box that clips it, it flips to the side
   * with room.
   * @type {import("../Popover/Popover.svelte").PopoverProps["align"]}
   */
  export let align = "bottom";

  /**
   * Specify the accessible name of the default beacon.
   * Used only when the "target" slot is empty.
   */
  export let beaconLabel = "Show coachmark";

  /** Specify the accessible name of the close button */
  export let closeIconDescription = "Close";

  /** Set to `false` to keep the coachmark open on a click outside of it */
  export let closeOnOutsideClick = true;

  /**
   * Set to `true` to always move focus into the dialog when it opens, or
   * `false` to never. Left unset, focus moves only when the user opens it:
   * through the target, or from a control inside the coachmark. Set it to
   * `true` when one coachmark opens the next in a tour.
   * @type {boolean | undefined}
   */
  export let focusOnOpen = undefined;

  /**
   * Specify a selector for the element that takes focus when the user opens
   * the coachmark. It falls back to the first form field, then the close
   * button. Set to `null` to move no focus.
   * @type {string | null}
   */
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";

  /**
   * Set to `true` to always render the coachmark in a portal, or `false`
   * to keep it in place. Left unset, it moves to a portal inside a `Modal`,
   * or when a box around it (`overflow` other than `visible`) would cut it
   * off.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  /**
   * Specify a class for the popover.
   * The class is also applied when the popover is portalled.
   * @type {string | undefined}
   */
  export let popoverClass = undefined;

  /**
   * Set an id for the coachmark element.
   * The dialog id derives from it as `{id}-content`, and the heading as
   * `{id}-title`.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the dialog element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Popover from "../Popover/Popover.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import { MODAL_CONTEXT_KEY } from "../constants/context-keys.js";
  import Close from "../icons/Close.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { dismiss } from "../utils/dismiss.js";
  import {
    initialFocus,
    returnFocus,
    returnFocusOnClose,
  } from "../utils/focus.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import { noop } from "../utils/noop.js";
  import { uniqueId } from "../utils/unique-id.js";
  import CoachmarkBeacon from "./CoachmarkBeacon.svelte";

  const dispatch = createEventDispatcher();
  const insideModal = getContext(MODAL_CONTEXT_KEY);

  /** @type {null | HTMLSpanElement} */
  let anchorRef = null;
  /** @type {null | HTMLButtonElement} */
  let closeRef = null;
  let disconnectModalObserver = noop;

  /** @type {boolean | undefined} */
  let prevOpen;
  /** @type {CoachmarkCloseTrigger | null} */
  let pendingTrigger = null;
  // The user opened it through the target.
  let openedByTarget = false;
  // Focus moves into the dialog once it is in the page, if the user opened it.
  let pendingFocus = false;

  $: dialogId = `${id}-content`;
  $: titleId = `${id}-title`;
  $: triggerId = `${id}-target`;
  $: hasTitle = !!(title || $$slots.title);

  $: triggerProps = {
    id: triggerId,
    "aria-haspopup": /** @type {const} */ ("dialog"),
    "aria-expanded": open,
    "aria-controls": dialogId,
  };

  // Naming and description belong on the dialog, not the wrapper. A consumer
  // `aria-label` wins over `title`.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
  $: labelledBy =
    ariaLabelledBy ?? (ariaLabel || !hasTitle ? undefined : titleId);

  $: effectivePortalTooltip =
    portalTooltip === undefined ? !!insideModal : portalTooltip;
  // Left unset outside a `Modal`, Popover moves to a portal when clipped.
  $: portalPopover = portalTooltip ?? (insideModal ? true : undefined);

  // Open and close in one block that reads only `open`, so it runs once per
  // change and `close` can name what closed it.
  $: handleOpenChange(open);

  // However it closes, a dialog that holds focus hands it back to the
  // target, so focus does not stay on a hidden button. A tour that opens
  // the next stop in the same update keeps focus there.
  const syncFocusReturn = returnFocusOnClose(
    () => document.getElementById(triggerId),
    () => ref,
  );
  $: syncFocusReturn(open);

  $: if (pendingFocus && open && ref) {
    pendingFocus = false;
    tick().then(focusDialog);
  }

  // Close when an ancestor modal closes so the portalled dialog does not linger.
  $: {
    disconnectModalObserver();
    disconnectModalObserver =
      effectivePortalTooltip && anchorRef
        ? observeModalClose(anchorRef, () => close("programmatic"))
        : () => {};
  }

  /** @param {boolean} next */
  function handleOpenChange(next) {
    if (prevOpen === next) return;
    const initial = prevOpen === undefined;
    prevOpen = next;
    if (initial) return;
    if (next) {
      // Unless `focusOnOpen` says, focus moves only when the user asked for
      // the coachmark: through the target, or from a control inside it. An
      // auto-opened first-visit coachmark must not take focus from a form.
      pendingFocus =
        focusOnOpen ??
        (openedByTarget ||
          (typeof document !== "undefined" &&
            !!anchorRef?.contains(document.activeElement)));
      openedByTarget = false;
      dispatch("open");
    } else {
      pendingFocus = false;
      const trigger = pendingTrigger ?? "programmatic";
      pendingTrigger = null;
      dispatch("close", { trigger });
    }
  }

  function focusDialog() {
    if (!(open && ref)) return;
    const target = initialFocus({
      container: ref,
      selectorPrimaryFocus,
      fallbacks: [closeRef],
    });
    target?.focus({ preventScroll: true });
  }

  /**
   * Close the coachmark and report what closed it.
   * @param {CoachmarkCloseTrigger} [trigger]
   */
  function close(trigger = "programmatic") {
    if (!open) return;
    pendingTrigger = trigger;
    open = false;
    // An outside click leaves focus where the user put it.
    if (trigger === "outside-click" || trigger === "programmatic") return;
    const region = ref;
    tick().then(() => {
      returnFocus(document.getElementById(triggerId), region);
    });
  }

  function closeFromSlot() {
    close("action");
  }

  function toggle() {
    if (open) {
      close("target");
    } else {
      openedByTarget = true;
      open = true;
    }
  }

  // Escape closes only from focus inside the coachmark: its target or its
  // dialog. A window listener would close it while the user presses Escape
  // in an unrelated input.
  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (!open || event.key !== "Escape") return;
    // Escape that cancels an IME composition is not a close.
    if (isImeComposition(event)) return;
    event.stopPropagation();
    close("escape-key");
  }

  /** @param {Event} event */
  function handleOutsideClick(event) {
    if (open && isOutsideClick(event, [anchorRef, ref])) close("outside-click");
  }

  onMount(() => disconnectModalObserver);
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
  bind:this={anchorRef}
  {id}
  class:bx--coachmark={true}
  class:bx--coachmark--open={open}
  use:dismiss={{
    enabled: open && closeOnOutsideClick,
    listeners: [{ type: "click", handler: handleOutsideClick }],
  }}
  on:keydown={handleKeydown}
  {...wrapperProps}
>
  <slot name="target" {open} {toggle} {triggerProps}>
    <CoachmarkBeacon label={beaconLabel} {...triggerProps} on:click={toggle} />
  </slot>
  <Popover
    bind:ref
    {open}
    {align}
    {portalPopover}
    id={dialogId}
    role="dialog"
    aria-label={ariaLabel}
    aria-labelledby={labelledBy}
    aria-describedby={ariaDescribedBy}
    caret
    highContrast
    class={["bx--toggletip-popover bx--coachmark-popover", popoverClass]
      .filter(Boolean)
      .join(" ")}
  >
    <!-- In a portal, the content is outside the wrapper's listeners. -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class:bx--coachmark-content={true} on:keydown={handleKeydown}>
      <div class:bx--coachmark__header={true}>
        {#if hasTitle}
          <h2 id={titleId} class:bx--coachmark__title={true} tabindex="-1">
            <slot name="title">{title}</slot>
          </h2>
        {/if}
        <button
          bind:this={closeRef}
          type="button"
          class:bx--coachmark__close={true}
          aria-label={closeIconDescription}
          on:click={() => close("close-button")}
        >
          <Close />
        </button>
      </div>
      <div class:bx--coachmark__body={true}>
        <slot close={closeFromSlot} />
      </div>
      {#if $$slots.actions}
        <div class:bx--coachmark__actions={true}>
          <slot name="actions" close={closeFromSlot} />
        </div>
      {/if}
    </div>
  </Popover>
</span>
