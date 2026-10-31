<script>
  /**
   * @typedef {"columnSortAscending" | "columnSortDescending" | "columnResize"} TableHeaderTranslationId
   */

  /**
   * @event {{ phase: "start" | "move" | "end" | "cancel" | "set" | "reset"; width?: number }} resize - Dispatched by the resize handle. A pointer drag sends `start`, then `move` for each pointer move, then `end` (or `cancel` on Escape). A key press sends `set`, and a double click sends `reset`.
   */

  /** Set to `true` for the sortable variant */
  export let sortable = false;

  /**
   * Specify the sort direction.
   * @type {"none" | "ascending" | "descending"}
   */
  export let sortDirection = "none";

  /** Set to `true` if the column sorting */
  export let active = false;

  /**
   * Specify the `scope` attribute
   * @type {"col" | "row" | "colgroup" | "rowgroup"}
   */
  export let scope = "col";

  /** Set to `true` to render a handle at the inline end of the header that resizes the column */
  export let resizable = false;

  /**
   * The column's width in pixels, reported by the resize handle as its value.
   * Measured from the header when unset.
   * @type {number | undefined}
   */
  export let resizeWidth = undefined;

  /** The narrowest the resize handle makes the column, in pixels */
  export let resizeMin = MIN_COLUMN_WIDTH;

  /** The widest the resize handle makes the column, in pixels */
  export let resizeMax = MAX_COLUMN_WIDTH;

  /** Default translation ids */
  export const translationIds = /** @type {const} */ ({
    columnSortAscending: "columnSortAscending",
    columnSortDescending: "columnSortDescending",
    columnResize: "columnResize",
  });

  /**
   * Override the default translation ids.
   * @type {(id: TableHeaderTranslationId) => string}
   */
  export let translateWithId = function translateWithId(id) {
    return defaultTranslations[id];
  };

  /** Set an id for the top-level element */
  export let id = uniqueId();

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";
  import { SEPARATOR_HOVER_DELAY_MS } from "../constants/timing.js";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import ArrowsVertical from "../icons/ArrowsVertical.svelte";
  import { createDelayedSetter } from "../utils/delayed-setter.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import {
    getLayoutDirection,
    inlineKey,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { clamp } from "../utils/numeric-format.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH } from "./data-table-utils.js";

  const KEY_STEP = 10;
  const KEY_STEP_LARGE = 40;

  const defaultTranslations = {
    [translationIds.columnSortAscending]:
      "Sort rows by this header in ascending order",
    [translationIds.columnSortDescending]:
      "Sort rows by this header in descending order",
    [translationIds.columnResize]: "Resize column",
  };

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();
  const scheduleHover = createDelayedSetter();

  $: translationId = active
    ? sortDirection === "descending"
      ? translationIds.columnSortAscending
      : translationIds.columnSortDescending
    : translationIds.columnSortAscending;
  $: ariaLabel =
    translateWithId?.(translationId) ?? defaultTranslations[translationId];

  $: labelId = `${id}-label`;
  $: resizeLabel =
    translateWithId?.(translationIds.columnResize) ??
    defaultTranslations[translationIds.columnResize];

  /** @type {null | HTMLElement} */
  let handleRef = null;
  // Pointer press or key press has the handle's header measured on demand,
  // and the value stands in until the table gives the column a width.
  let measuredWidth = 0;
  let hovered = false;
  let resizing = false;
  let cancelled = false;
  let startPoint = 0;
  let startWidth = 0;
  let lastWidth = 0;
  let direction = 1;

  function headerWidth() {
    return handleRef?.closest("th")?.getBoundingClientRect().width ?? 0;
  }

  /** @param {number} width */
  function limit(width) {
    return clamp(Math.round(width), resizeMin, resizeMax);
  }

  /** @param {PointerEvent} event */
  function handleDragStart(event) {
    scheduleHover.cancel();
    resizing = true;
    cancelled = false;
    // Dragging toward the inline end grows the column: left in RTL.
    direction =
      resolveLayoutDirection($layoutDirection, handleRef) === "rtl" ? -1 : 1;
    startPoint = event.clientX;
    // The table freezes every column's width on `start`, which leaves each
    // where it is, so the baseline read here is the width the drag starts at.
    startWidth = headerWidth();
    lastWidth = startWidth;
    dispatch("resize", { phase: "start" });
  }

  /** @param {PointerEvent} event */
  function handleDragMove(event) {
    if (cancelled) return;
    lastWidth = limit(startWidth + direction * (event.clientX - startPoint));
    dispatch("resize", { phase: "move", width: lastWidth });
  }

  function handleDragEnd() {
    resizing = false;
    // A press with no movement changes nothing.
    if (!cancelled && lastWidth !== startWidth) {
      dispatch("resize", { phase: "end", width: lastWidth });
    }
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    // Alt/Ctrl/Meta+Arrow belong to the browser.
    if (hasModifierKey(event)) return;
    if (event.key === "Escape") {
      if (!resizing) return;
      cancelled = true;
      dispatch("resize", { phase: "cancel" });
      return;
    }
    const current = resizeWidth ?? headerWidth();
    const distance = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    // ArrowRight moves the handle toward the inline end, growing the column.
    const key = inlineKey(event.key, $layoutDirection, handleRef);
    let next;
    if (key === "ArrowLeft") next = current - distance;
    else if (key === "ArrowRight") next = current + distance;
    else if (event.key === "Home") next = resizeMin;
    else if (event.key === "End") next = resizeMax;
    else return;
    event.preventDefault();
    next = limit(next);
    if (next !== Math.round(current)) {
      dispatch("resize", { phase: "set", width: next });
    }
  }

  function handleDblclick() {
    dispatch("resize", { phase: "reset" });
  }

  // Touch has no hover, and a pass over the handle shouldn't flash it.
  /** @param {PointerEvent} event */
  function handlePointerenter(event) {
    if (event.pointerType === "touch") return;
    scheduleHover(SEPARATOR_HOVER_DELAY_MS, () => {
      hovered = true;
    });
  }

  function handlePointerleave() {
    scheduleHover.cancel();
    hovered = false;
  }

  // A resizable column can be narrower than its label, which then ends in an
  // ellipsis. The full label shows as a `title` while it is cut.
  /**
   * @param {HTMLElement} label
   * @param {boolean} enabled
   */
  function fullLabelTitle(label, enabled) {
    let active = enabled;
    const show = () => {
      if (!active) return;
      if (label.scrollWidth > label.clientWidth) {
        label.title = label.textContent?.trim() ?? "";
      } else {
        label.removeAttribute("title");
      }
    };
    label.addEventListener("mouseenter", show);
    return {
      /** @param {boolean} next */
      update(next) {
        active = next;
        if (!next) label.removeAttribute("title");
      },
      destroy() {
        label.removeEventListener("mouseenter", show);
      },
    };
  }

  function measure() {
    measuredWidth = Math.round(headerWidth());
  }

  onMount(() => {
    if (resizable) measure();
    return () => scheduleHover.cancel();
  });

  // Inside a DataTable, an active AI label marks the whole column.
  const setColumnAILabel = getContext("carbon:DataTable")?.setColumnAILabel;

  /**
   * Starts active for a filled slot, so the server renders the AI surface.
   * `Decorator` clears it when no `AILabel` claims the slot. A DataTable
   * fills every header's slot from `headerDecorator`, which can hold a label
   * for some columns only, so it starts unset there.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  const aiLabelState = writable(
    $$slots.decorator && !setColumnAILabel ? "active" : undefined,
  );
  $: setColumnAILabel?.(id, $aiLabelState === "active");
  onMount(() => () => setColumnAILabel?.(id, false));
</script>

{#if sortable}
  <th
    {id}
    aria-sort={active ? sortDirection : "none"}
    aria-labelledby={resizable ? labelId : undefined}
    {scope}
    data-header={id}
    class:bx--table-sort__header--decorator={$$slots.decorator}
    class:bx--table-header--ai-label={$aiLabelState === "active"}
    class:bx--table-header--resizable={resizable}
    {...$$restProps}
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if $$slots.decorator}
      <div class:bx--table-sort__decorator-wrapper={true}>
        <button
          type="button"
          class:bx--table-sort={true}
          class:bx--table-sort--active={active}
          class:bx--table-sort--ascending={active &&
            sortDirection === "descending"}
          on:click
        >
          <div
            id={labelId}
            class:bx--table-header-label={true}
            use:fullLabelTitle={resizable}
          >
            <slot />
          </div>
          <ArrowUp
            size={20}
            aria-label={ariaLabel}
            class="bx--table-sort__icon"
          />
          <ArrowsVertical
            size={20}
            aria-label={ariaLabel}
            class="bx--table-sort__icon-unsorted"
          />
        </button>
        <Decorator
          class="bx--table-sort__decorator"
          state={aiLabelState}
          labelAlign="start"
        >
          <slot name="decorator" />
        </Decorator>
      </div>
    {:else}
      <button
        type="button"
        class:bx--table-sort={true}
        class:bx--table-sort--active={active}
        class:bx--table-sort--ascending={active &&
          sortDirection === "descending"}
        on:click
      >
        <div
          id={labelId}
          class:bx--table-header-label={true}
          use:fullLabelTitle={resizable}
        >
          <slot />
        </div>
        <ArrowUp
          size={20}
          aria-label={ariaLabel}
          class="bx--table-sort__icon"
        />
        <ArrowsVertical
          size={20}
          aria-label={ariaLabel}
          class="bx--table-sort__icon-unsorted"
        />
      </button>
    {/if}

    {#if resizable}
      <!-- A focusable separator is an interactive widget (WAI-ARIA window splitter). -->
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div
        bind:this={handleRef}
        role="separator"
        tabindex="0"
        aria-orientation="vertical"
        aria-label={resizeLabel}
        aria-labelledby="{id}-resize {labelId}"
        aria-valuenow={Math.round(resizeWidth ?? measuredWidth) || undefined}
        aria-valuemin={resizeMin}
        aria-valuemax={resizeMax}
        id="{id}-resize"
        class:bx--table-header__resize-handle={true}
        class:bx--table-header__resize-handle--hover={hovered}
        class:bx--table-header__resize-handle--active={resizing}
        use:pointerDrag={{
          onStart: handleDragStart,
          onMove: handleDragMove,
          onEnd: handleDragEnd,
        }}
        on:keydown={handleKeydown}
        on:focus={measure}
        on:dblclick={handleDblclick}
        on:click={(event) => event.stopPropagation()}
        on:pointerenter={handlePointerenter}
        on:pointerleave={handlePointerleave}
      ></div>
    {/if}
  </th>
{:else}
  <th
    {id}
    {scope}
    aria-labelledby={resizable ? labelId : undefined}
    data-header={id}
    class:bx--table-header--ai-label={$aiLabelState === "active"}
    class:bx--table-header--resizable={resizable}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <div
      id={labelId}
      class:bx--table-header-label={true}
      use:fullLabelTitle={resizable}
      class:bx--table-header-label--decorator={$$slots.decorator}
    >
      <slot />
      {#if $$slots.decorator}
        <Decorator
          class="bx--table-header-label--decorator-inner"
          state={aiLabelState}
          labelAlign="start"
        >
          <slot name="decorator" />
        </Decorator>
      {/if}
    </div>
    {#if resizable}
      <!-- A focusable separator is an interactive widget (WAI-ARIA window splitter). -->
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div
        bind:this={handleRef}
        role="separator"
        tabindex="0"
        aria-orientation="vertical"
        aria-label={resizeLabel}
        aria-labelledby="{id}-resize {labelId}"
        aria-valuenow={Math.round(resizeWidth ?? measuredWidth) || undefined}
        aria-valuemin={resizeMin}
        aria-valuemax={resizeMax}
        id="{id}-resize"
        class:bx--table-header__resize-handle={true}
        class:bx--table-header__resize-handle--hover={hovered}
        class:bx--table-header__resize-handle--active={resizing}
        use:pointerDrag={{
          onStart: handleDragStart,
          onMove: handleDragMove,
          onEnd: handleDragEnd,
        }}
        on:keydown={handleKeydown}
        on:focus={measure}
        on:dblclick={handleDblclick}
        on:click={(event) => event.stopPropagation()}
        on:pointerenter={handlePointerenter}
        on:pointerleave={handlePointerleave}
      ></div>
    {/if}
  </th>
{/if}
