<script context="module">
  // Space (px) between the tag and the portalled content.
  const PORTAL_GAP = 4;
  // Neutralizes the popover alignment transforms so the portal places it.
  const PORTAL_NEUTRALIZE_STYLE = "inset: auto; transform: none;";

  // "bottom" + "start" -> "bottom-left", and so on.
  function toPopoverAlign(dir, intrinsic) {
    if (intrinsic === "center") return dir;
    return `${dir}-${intrinsic === "start" ? "left" : "right"}`;
  }
</script>

<script>
  /**
   * @template [Icon=any]
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
   * @type {"sm" | "default" | "lg" | "md"}
   */
  export let size = undefined;

  /** Set to `true` to disable the tag */
  export let disabled = false;

  /**
   * Specify the icon to render.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Set to `true` to open the popover.
   * @bindable writable
   */
  export let open = false;

  /**
   * Set the alignment of the popover relative to the tag.
   * @type {"start" | "center" | "end"}
   */
  export let align = "start";

  /**
   * Set the direction of the popover relative to the tag.
   * @type {"top" | "bottom"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to render the popover in a portal,
   * preventing it from being clipped by `overflow: hidden` containers.
   * By default, the popover is portalled when inside a `Modal` or `DataTable`.
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
  import { MODAL_CONTEXT_KEY } from "../constants/context-keys.js";
  import Popover from "../Popover/Popover.svelte";
  import AnchoredTooltip from "../Portal/AnchoredTooltip.svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import { joinTagSet } from "../TagSet/join-tag-set.js";
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

  let wrapperRef = null;
  let portalRef = null;
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
  $: popoverAlign = toPopoverAlign(direction, align);
  $: insideElements = [wrapperRef, portalRef];
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
    aria-expanded={hasContent ? open : undefined}
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
  {#if hasContent && !effectivePortal}
    <Popover {open} align={popoverAlign} id={contentId}>
      <div bind:this={contentRef} class:bx--operational-tag__content={true}>
        <slot name="content" />
      </div>
    </Popover>
  {/if}
</span>

{#if hasContent && effectivePortal}
  <FloatingPortal
    anchor={ref}
    {direction}
    {open}
    intrinsicWidth
    intrinsicAlign={align}
    gapTop={PORTAL_GAP}
    gapBottom={PORTAL_GAP}
    bind:ref={portalRef}
    let:direction={actualDirection}
  >
    <Popover
      open
      relative
      align={toPopoverAlign(actualDirection ?? direction, align)}
      id={contentId}
      style={PORTAL_NEUTRALIZE_STYLE}
    >
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        bind:this={contentRef}
        class:bx--operational-tag__content={true}
        on:keydown={handleKeydown}
      >
        <slot name="content" />
      </div>
    </Popover>
  </FloatingPortal>
{/if}
