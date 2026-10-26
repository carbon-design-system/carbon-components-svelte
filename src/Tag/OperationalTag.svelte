<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   */

  /**
   * A tag that discloses related content, such as more tags, in a popover.
   * The whole tag is the trigger. Without `content`, it's a plain action
   * button; handle `on:click`.
   *
   * @event {null} open
   * @event {null} close
   * @slot {{}} content - The popover content.
   * @slot {{}} icon - Override the tag icon.
   * @restProps {button}
   */

  /**
   * Specify the type of tag.
   * @type {"red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray"}
   */
  export let type = "gray";

  /**
   * Specify the size of the tag.
   * Defaults to `"default"`, or to the `size` of a parent `TagSet`.
   * Also accepts Carbon v11's `"md"` (`"default"`).
   * @type {"sm" | "default" | "lg" | "md" | undefined}
   */
  export let size = undefined;

  /** Set to `true` to disable the tag */
  export let disabled = false;

  /**
   * Specify the icon to render.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Set to `true` to open the popover.
   * @bindable writable
   */
  export let open = false;

  /**
   * Set the alignment of the popover relative to the tag.
   * `start` and `end` name inline sides, so they swap under `dir="rtl"`.
   * @type {"start" | "center" | "end"}
   */
  export let align = "start";

  /**
   * Set the direction of the popover relative to the tag.
   * @type {"top" | "bottom"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to always render the popover in a portal, or `false` to
   * keep it in place. Left unset, the popover moves to a portal inside a
   * `Modal`, or when a box around it (`overflow` other than `visible`) would
   * cut it off.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  /**
   * Set an id for the tag.
   * The popover id derives from it as `{id}-content`.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the tag's button element.
   * @bindable readonly
   * @type {null | HTMLButtonElement}
   */
  export let ref = null;

  /**
   * Obtain a reference to the popover content element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let contentRef = null;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import Popover from "../Popover/Popover.svelte";
  import AnchoredTooltip from "../Portal/AnchoredTooltip.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import { joinTagSet } from "../TagSet/join-tag-set.js";
  import { MODAL_CONTEXT_KEY } from "../constants/context-keys.js";
  import { dismiss } from "../utils/dismiss.js";
  import { createOpenCloseDispatcher } from "../utils/dispatch-open-close.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import { noop } from "../utils/noop.js";
  import { normalizeSize, TAG_SIZE_ALIASES } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { observeTruncation } from "./tag-truncation.js";

  const dispatch = createEventDispatcher();
  const notifyOpenChange = createOpenCloseDispatcher(dispatch);
  const insideModal = getContext(MODAL_CONTEXT_KEY);

  // Inside a `TagSet`, register like `Tag` does.
  const group = joinTagSet(() => ({
    node: ref,
    label: ref?.textContent?.trim() ?? "",
    type,
    size: resolvedSize,
    disabled,
    filter: false,
  }));
  const {
    size: groupSize,
    overflow: groupOverflow,
    tabindex: rovingTabindex,
  } = group;

  /** @type {null | HTMLSpanElement} */
  let wrapperRef = null;
  // The popover, in place or in a portal.
  let popoverRef = null;
  /** @type {null | HTMLSpanElement} */
  let labelRef = null;
  let truncated = false;
  let stopObservingLabel = noop;
  let disconnectModalObserver = noop;
  // Window listeners are enabled on the frame after opening, so the click
  // that opened the popover can't bubble to the outside-click handler and
  // close it again (as in `Toggletip`).
  let listenersEnabled = false;
  let enableFrame;

  $: resolvedSize =
    normalizeSize(size, TAG_SIZE_ALIASES) ?? $groupSize ?? "default";
  // Without `content`, the tag is a plain action trigger: no popover, and
  // no disclosure state.
  $: hasContent = !!$$slots.content;
  $: contentId = `${id}-content`;
  $: effectivePortal =
    portalTooltip === undefined ? !!insideModal : portalTooltip;
  // Left unset outside a `Modal`, Popover moves to a portal when clipped.
  $: portalPopover = portalTooltip ?? (insideModal ? true : undefined);
  // Popover resolves `start` and `end` to physical sides when it opens.
  /** @type {import("../Popover/Popover.svelte").PopoverProps["align"]} */
  $: popoverAlign =
    align === "center"
      ? direction
      : /** @type {`${typeof direction}-${typeof align}`} */ (
          `${direction}-${align}`
        );
  $: insideElements = [wrapperRef, popoverRef];
  $: if (disabled || !hasContent) open = false;
  $: hasIcon = Boolean(icon || $$slots.icon);

  // A truncated label shows its full text in a tooltip on the tag, except
  // while the popover is open. A disabled tag gets no hover or focus, so it
  // falls back to `title`.
  $: {
    stopObservingLabel();
    stopObservingLabel = labelRef
      ? observeTruncation(labelRef, (value) => {
          truncated = value;
        })
      : noop;
  }
  $: truncationLabel = truncated ? (labelRef?.textContent?.trim() ?? "") : "";

  $: group.update({ type, size: resolvedSize, disabled });

  function toggle() {
    if (!disabled && hasContent) open = !open;
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

  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    // Some browsers report a null relatedTarget when clicking non-focusable
    // popover content; keep it open then.
    if (!open || event.relatedTarget === null) return;
    if (!insideElements.some((node) => node?.contains(event.relatedTarget))) {
      close();
    }
  }

  /** @param {MouseEvent} event */
  function handleOutsideClick(event) {
    if (open && isOutsideClick(event, insideElements)) close();
  }

  // Close when an ancestor modal closes so the portalled content doesn't linger.
  $: {
    disconnectModalObserver();
    disconnectModalObserver =
      effectivePortal && ref ? observeModalClose(ref, close) : noop;
  }

  $: if (typeof requestAnimationFrame !== "undefined") {
    cancelAnimationFrame(enableFrame);
    if (open) {
      enableFrame = requestAnimationFrame(() => {
        if (open) listenersEnabled = true;
      });
    } else {
      listenersEnabled = false;
    }
  }
  $: notifyOpenChange(open);

  onMount(() => {
    return () => {
      cancelAnimationFrame(enableFrame);
      disconnectModalObserver();
      stopObservingLabel();
    };
  });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
  bind:this={wrapperRef}
  class:bx--operational-tag={true}
  data-overflow={$groupOverflow ? "true" : undefined}
  use:dismiss={{
    enabled: listenersEnabled,
    listeners: [{ type: "click", handler: handleOutsideClick }],
  }}
  on:keydown={handleKeydown}
  on:focusout={handleFocusout}
>
  <button
    bind:this={ref}
    type="button"
    {id}
    {disabled}
    aria-expanded={hasContent ? String(open) : undefined}
    aria-controls={hasContent ? contentId : undefined}
    tabindex={$rovingTabindex}
    title={disabled && truncated ? truncationLabel : undefined}
    class:bx--tag={true}
    class:bx--tag--interactive={true}
    class:bx--tag--operational={true}
    class:bx--tag--disabled={disabled}
    class:bx--tag--with-icon={hasIcon}
    class:bx--tag--sm={resolvedSize === "sm"}
    class:bx--tag--lg={resolvedSize === "lg"}
    class:bx--tag--red={type === "red"}
    class:bx--tag--magenta={type === "magenta"}
    class:bx--tag--purple={type === "purple"}
    class:bx--tag--blue={type === "blue"}
    class:bx--tag--cyan={type === "cyan"}
    class:bx--tag--teal={type === "teal"}
    class:bx--tag--green={type === "green"}
    class:bx--tag--gray={type === "gray"}
    class:bx--tag--cool-gray={type === "cool-gray"}
    class:bx--tag--warm-gray={type === "warm-gray"}
    {...$$restProps}
    on:click={toggle}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if $$slots.icon || icon}
      <div class:bx--tag__custom-icon={true}>
        <slot name="icon"><svelte:component this={icon} /></slot>
      </div>
    {/if}
    <span bind:this={labelRef} class:bx--tag__label={true}><slot /></span>
  </button>
  <AnchoredTooltip
    passEscapeWhenFocused
    anchor={ref}
    text={truncationLabel}
    enabled={truncated && !disabled && !open}
  />
  {#if hasContent}
    <Popover
      bind:ref={popoverRef}
      {open}
      align={popoverAlign}
      {portalPopover}
      id={contentId}
      class="bx--operational-tag__popover"
    >
      <!-- In a portal, the content is outside the wrapper's listeners. -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        bind:this={contentRef}
        class:bx--operational-tag__content={true}
        on:keydown={handleKeydown}
      >
        <slot name="content" />
      </div>
    </Popover>
  {/if}
</span>
