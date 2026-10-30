<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @restProps {span}
   */

  /**
   * @event {null} open
   * @event {null} close
   * @slot {{}} labelChildren - Set the toggletip label, rendered beside the button.
   * @deprecated use the `labelChildren` slot
   * @slot {{}} labelText
   * @slot {{}} icon - Override the button icon.
   */

  /**
   * Set the alignment of the content relative to the button.
   * Above and below the button, `start` and `end` name inline sides, so
   * they swap under `dir="rtl"`.
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  /**
   * Set the direction of the content relative to the button.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to open the toggletip.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the icon to render for the toggletip button.
   * Defaults to `<Information />`.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (Information);

  /** Specify the icon name attribute */
  export let iconName = "";

  /**
   * Specify the ARIA label for the toggletip button.
   * Set to `""` to name the button by its content instead.
   */
  export let iconDescription = "Show information";

  /**
   * Set the toggletip label text.
   * Alternatively, use the "labelChildren" slot.
   */
  export let labelText = "";

  /**
   * Obtain a reference to the button HTML element.
   * @bindable readonly
   * @type {null | HTMLButtonElement}
   */
  export let ref = null;

  /**
   * Set to `true` to always render the content in a portal, or `false` to
   * keep it in place. Left unset, the content moves to a portal inside a
   * `Modal`, or when a box around it (`overflow` other than `visible`) would
   * cut it off.
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
   * Set an id for the toggletip element.
   * The content id derives from it as `{id}-content`.
   */
  export let id = uniqueId();

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import Popover from "../Popover/Popover.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import { MODAL_CONTEXT_KEY } from "../constants/context-keys.js";
  import Information from "../icons/Information.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { dismiss } from "../utils/dismiss.js";
  import { createOpenCloseDispatcher } from "../utils/dispatch-open-close.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import { noop } from "../utils/noop.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const notifyOpenChange = createOpenCloseDispatcher(dispatch);
  const insideModal = getContext(MODAL_CONTEXT_KEY);

  /** @type {null | HTMLSpanElement} */
  let toggletipRef = null;
  // The popover, in place or in a portal.
  let popoverRef = null;
  let disconnectModalObserver = noop;

  $: contentId = `${id}-content`;

  // Naming and description belong on the trigger button, not the wrapper.
  // A consumer `aria-label` wins over `iconDescription`.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
  $: effectivePortalTooltip =
    portalTooltip === undefined ? !!insideModal : portalTooltip;
  // Left unset outside a `Modal`, Popover moves to a portal when clipped.
  $: portalPopover = portalTooltip ?? (insideModal ? true : undefined);

  // The v11 placement: above and below the button, `start` and `end` are
  // inline sides, so Popover swaps them in RTL. Popover also fits it to the
  // window and the button's container, and places the caret.
  /** @type {import("../Popover/Popover.svelte").PopoverProps["align"]} */
  $: popoverAlign =
    align === "center"
      ? direction
      : /** @type {`${typeof direction}-${typeof align}`} */ (
          `${direction}-${align}`
        );

  // Window listeners are enabled on the animation frame after opening. Svelte
  // flushes the open state synchronously while the triggering click is still
  // propagating, so enabling them immediately would let the click that opened
  // the toggletip (e.g. from an external trigger) bubble to the window handler
  // and close it again. Deferring past the current event mirrors the
  // post-render effect in the upstream component.
  let listenersEnabled = false;
  let enableFrame;

  function toggle() {
    open = !open;
  }

  function close() {
    open = false;
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (open && event.key === "Escape") {
      // Escape that cancels an IME composition is not a close.
      if (isImeComposition(event)) return;
      event.stopPropagation();
      close();
      ref?.focus();
    }
  }

  // Portalled content lives outside `toggletipRef`, so treat the popover as
  // "inside" for focus and outside-click handling.
  $: insideElements = [toggletipRef, popoverRef];

  function containsTarget(target) {
    return insideElements.some((node) => node?.contains(target));
  }

  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    // Keep open when focus moves to the toggletip content itself (relatedTarget
    // is null on some browsers when clicking non-focusable content).
    if (open && event.relatedTarget === null) return;
    if (!containsTarget(event.relatedTarget)) close();
  }

  function handleOutsideClick(event) {
    if (open && isOutsideClick(event, insideElements)) close();
  }

  // Close when an ancestor modal closes so the portalled content does not linger.
  $: {
    disconnectModalObserver();
    disconnectModalObserver =
      effectivePortalTooltip && ref ? observeModalClose(ref, close) : () => {};
  }

  $: if (typeof requestAnimationFrame !== "undefined") {
    if (open) {
      cancelAnimationFrame(enableFrame);
      enableFrame = requestAnimationFrame(() => {
        if (open) listenersEnabled = true;
      });
    } else {
      cancelAnimationFrame(enableFrame);
      listenersEnabled = false;
    }
  }
  $: notifyOpenChange(open);

  onMount(() => {
    return () => {
      cancelAnimationFrame(enableFrame);
      disconnectModalObserver();
    };
  });
</script>

<!-- Flex wrapper so the label and button align without an inter-element
whitespace gap; the label's end margin is then the only spacing. -->
<span class:bx--toggletip-container={true}>
  {#if labelText || $$slots.labelChildren || $$slots.labelText}
    <span class:bx--toggletip-label={true}>
      <slot name="labelChildren"><slot name="labelText">{labelText}</slot></slot
      >
    </span>
  {/if}

  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <span
    bind:this={toggletipRef}
    {id}
    class:bx--toggletip={true}
    class:bx--toggletip--open={open}
    use:dismiss={{
      enabled: listenersEnabled,
      listeners: [{ type: "click", handler: handleOutsideClick }],
    }}
    on:keydown={handleKeydown}
    on:focusout={handleFocusout}
    {...wrapperProps}
  >
    <button
      bind:this={ref}
      type="button"
      class:bx--toggletip-button={true}
      aria-label={ariaLabel ?? (iconDescription || undefined)}
      aria-labelledby={ariaLabelledBy}
      aria-expanded={open}
      aria-controls={contentId}
      aria-describedby={joinDescribedBy(
        open ? contentId : undefined,
        ariaDescribedBy,
      )}
      on:click={toggle}
    >
      <slot name="icon">
        <svelte:component this={icon} name={iconName} />
      </slot>
    </button>
    <Popover
      bind:ref={popoverRef}
      {open}
      align={popoverAlign}
      {portalPopover}
      id={contentId}
      caret
      highContrast
      class={["bx--toggletip-popover", popoverClass].filter(Boolean).join(" ")}
    >
      <!-- In a portal, the content is outside the wrapper's listeners. -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class:bx--toggletip-content={true}
        on:keydown={handleKeydown}
        on:focusout={handleFocusout}
      >
        <slot />
      </div>
    </Popover>
  </span>
</span>
