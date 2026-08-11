<script>
  /**
   * Internal: the "+N" overflow indicator. Not exported from the package;
   * only `TagSet` ships. Hovering shows a tooltip (a comma-separated list of
   * the hidden labels by default, or custom content via the forwarded
   * `overflowTooltip` slot). Clicking opens a popover listing the overflow
   * tags and dispatches `trigger`.
   *
   * Always mounted (even when `count` is 0) so it stays measurable; visually
   * and functionally inert until there is something to show.
   *
   * @event {null} trigger - The indicator was clicked.
   * @event {import("./TagSet.svelte").TagSetItem} close:tag - Close on a
   * dismissible tag inside the overflow popover.
   * @slot {{ tags: import("./TagSet.svelte").TagSetItem[]; count: number }} tooltip - Override the tooltip content.
   */

  /**
   * Obtain a reference to the indicator's HTML element, so the parent can
   * measure its natural width for the fit calculation.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let triggerRef = null;

  /** @type {number} */
  export let count = 0;

  /** @type {import("./TagSet.svelte").TagSetItem[]} */
  export let tags = [];

  /** @type {"start" | "center" | "end"} */
  export let overflowAlign = "center";

  /** @type {"top" | "bottom"} */
  export let overflowDirection = "bottom";

  /** @type {"sm" | "default" | "lg" | undefined} */
  export let size = undefined;

  import { createEventDispatcher, setContext, tick } from "svelte";
  import Popover from "../Popover/Popover.svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import Tag from "../Tag/Tag.svelte";
  import TooltipDefinition from "../TooltipDefinition/TooltipDefinition.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";
  import { trapFocus } from "../utils/trapFocus.js";

  // The indicator is presentational, not a registered group item — shadow
  // the context so it (and tags rendered in the disclosure popover) can't be
  // mistaken for registered children.
  setContext("carbon:TagSet", undefined);

  const dispatch = createEventDispatcher();
  const contentId = `ccs-${Math.random().toString(36)}`;

  // Space (px) reserved for the caret between the anchor and the content.
  const PORTAL_GAP = 10;
  const PORTAL_NEUTRALIZE_STYLE = "inset: auto; transform: none;";

  /** @type {boolean} */
  let open = false;
  /** @type {boolean} */
  let tooltipOpen = false;
  /** @type {null | HTMLElement} */
  let buttonRef = null;
  /** @type {null | HTMLElement} */
  let portalRef = null;
  /** @type {null | HTMLElement} */
  let rootRef = null;
  /** @type {null | HTMLElement} */
  let listRef = null;

  let listenersEnabled = false;
  /** @type {number | undefined} */
  let enableFrame;

  $: if (open && count === 0) {
    open = false;
  }

  $: if (open) {
    tooltipOpen = false;
  }

  /**
   * @param {"top" | "bottom"} dir
   * @param {"start" | "center" | "end"} intrinsic
   */
  function toPopoverAlign(dir, intrinsic) {
    if (intrinsic === "center") return dir;
    return `${dir}-${intrinsic === "start" ? "left" : "right"}`;
  }

  function close() {
    open = false;
  }

  function handleTriggerClick() {
    if (count === 0) return;
    tooltipOpen = false;
    open = !open;
    dispatch("trigger");
    if (open) {
      tick().then(() => {
        const focusable = listRef?.querySelector(
          "button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])",
        );
        if (focusable instanceof HTMLElement) {
          focusable.focus();
        } else {
          listRef?.focus();
        }
      });
    }
  }

  /**
   * @param {import("./TagSet.svelte").TagSetItem} tag
   */
  function handlePopoverTagClose(tag) {
    dispatch("close:tag", tag);
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    if (!open) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      buttonRef?.focus();
      return;
    }
    if (event.key === "Tab" && listRef) {
      trapFocus({ container: listRef, event });
    }
  }

  /** @param {Event} event */
  function handleOutsideClick(event) {
    if (open && isOutsideClick(event, [rootRef, portalRef])) {
      close();
    }
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
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
  bind:this={rootRef}
  class:bx--tag-set-overflow={true}
  class:bx--tag-set-overflow--empty={count === 0}
  use:dismiss={{
    enabled: listenersEnabled,
    type: "click",
    handler: handleOutsideClick,
  }}
  on:keydown={onKeydown}
>
  <TooltipDefinition
    bind:open={tooltipOpen}
    bind:ref={buttonRef}
    align={overflowAlign}
    direction={overflowDirection}
    aria-expanded={open}
    aria-controls={open ? contentId : undefined}
    on:click={handleTriggerClick}
  >
    <svelte:fragment slot="tooltip">
      <slot name="tooltip" {tags} {count} />
    </svelte:fragment>
    <span
      bind:this={triggerRef}
      class:bx--tag={true}
      class:bx--tag--interactive={true}
      class:bx--tag-set-overflow__popover-trigger={true}
      class:bx--tag--sm={size === "sm"}
      class:bx--tag--lg={size === "lg"}
    >
      +{count}
    </span>
  </TooltipDefinition>

  {#if open}
    <FloatingPortal
      anchor={buttonRef}
      direction={overflowDirection}
      {open}
      intrinsicWidth={true}
      intrinsicAlign={overflowAlign}
      gapTop={PORTAL_GAP}
      gapBottom={PORTAL_GAP}
      bind:ref={portalRef}
      let:direction={actualDirection}
    >
      <Popover
        open
        relative
        caret
        id={contentId}
        align={toPopoverAlign(
          actualDirection ?? overflowDirection,
          overflowAlign,
        )}
        style={PORTAL_NEUTRALIZE_STYLE}
      >
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <ul
          bind:this={listRef}
          class:bx--tag-set-overflow__tagset-popover={true}
          class:bx--tag-set-overflow__tag-list={true}
          tabindex="-1"
          on:keydown={onKeydown}
        >
          {#each tags as tag (tag.id)}
            <li class:bx--tag-set-overflow__tag-item={true}>
              <Tag
                type={/** @type {any} */ (tag.type)}
                size={/** @type {any} */ (tag.size)}
                filter={tag.filter}
                disabled={tag.disabled}
                on:close={() => handlePopoverTagClose(tag)}
              >
                {tag.label}
              </Tag>
            </li>
          {/each}
        </ul>
      </Popover>
    </FloatingPortal>
  {/if}
</span>
