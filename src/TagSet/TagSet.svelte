<script>
  /**
   * @typedef {Object} TagSetItem
   * @property {string} id
   * @property {HTMLElement} node
   * @property {string} label
   * @property {string | number} [value]
   * @property {import("../Tag/Tag.svelte").TagProps["type"]} [type]
   * @property {string} size
   * @property {boolean} disabled
   * @property {boolean} filter
   */

  /**
   * Render a row of `Tag` children. `TagSet` measures the available width and
   * collapses whatever no longer fits into a "+N" overflow indicator, with a
   * hover tooltip listing the hidden labels by default. Override the tooltip
   * content with the `overflowTooltip` slot, for example to add a link.
   *
   * @event {{ tag: TagSetItem; index: number }} close:tag - User clicks the close icon on a dismissible (`filter`) tag.
   * @event {{ count: number }} click:overflow - User clicks the "+N" indicator. Cancelable: prevent it to keep a tooltip-mode set from opening the "View all" modal.
   * @event {{ count: number }} overflow:change - Dispatched when the number of overflowing tags changes, from a resize, a slotted-children change, or a `maxVisible` change.
   * @slot {{ tags: TagSetItem[]; count: number }} overflowTooltip - Override what the "+N" indicator shows: its tooltip, or its popover with `overflowMode="popover"`. Defaults to the hidden labels as text, or as tags in the popover.
   * @restProps {div}
   */

  /** Horizontal alignment of the visible tag row.
   * @type {"start" | "center" | "end"}
   */
  export let align = "start";

  /**
   * Alignment of the overflow tooltip relative to the "+N" indicator.
   * @type {"start" | "center" | "end"}
   */
  export let overflowAlign = "center";

  /**
   * Direction of the overflow tooltip relative to the "+N" indicator.
   * @type {"top" | "bottom"}
   */
  export let overflowDirection = "bottom";

  /**
   * How the "+N" indicator shows the hidden tags. `"tooltip"` lists their
   * labels in a hover tooltip. `"popover"` makes the indicator a button that
   * opens a popover of the hidden tags themselves, so dismissible ones can
   * still be closed and touch users can reach them.
   * @type {"tooltip" | "popover"}
   */
  export let overflowMode = "tooltip";

  /**
   * How the "+N" indicator lists the hidden tags: `"default"` lists their
   * labels as text, `"tag"` as tags in their own colors. In the popover and
   * the "View all" modal, `"tag"` keeps dismissible tags closable.
   * Defaults to `"default"` for the tooltip and `"tag"` for the popover.
   * @type {"default" | "tag" | undefined}
   */
  export let overflowType = undefined;

  /**
   * With more hidden tags than this, the popover lists only this many and
   * adds a "View all" button, and clicking a tooltip-mode "+N" opens the
   * modal directly. The modal lists every tag, with a search field.
   * Set to `Infinity` to never offer it.
   * @type {number}
   */
  export let viewAllThreshold = 10;

  /** Text of the popover's "View all" button. */
  export let viewAllText = "View all";

  /** Heading of the "View all" modal, also the name of its tag list. */
  export let allTagsTitle = "All tags";

  /** Label and placeholder of the "View all" modal's search field. */
  export let allTagsSearchLabel = "Search tags";

  /**
   * Text announced, and shown when nothing matches, for the number of tags
   * the "View all" search finds.
   * @type {(count: number) => string}
   */
  export let allTagsResultsLabel = (count) =>
    count === 0 ? "No matching tags" : count === 1 ? "1 tag" : `${count} tags`;

  /**
   * Set to `true` to open the "View all" modal.
   * @bindable writable
   */
  export let allTagsOpen = false;

  /**
   * Accessible name of the "+N" overflow indicator. Keep the visible "+N"
   * in the name so speech-input users can say what they see.
   * @type {(count: number) => string}
   */
  export let overflowLabel = (count) => `+${count} more tags`;

  /** Hard cap on visible tags regardless of available space.
   * @type {number | undefined}
   */
  export let maxVisible = undefined;

  /**
   * Keyboard navigation between tags. `"tab"` puts every interactive tag in
   * the tab order. `"roving"` makes the set a single tab stop: arrow keys,
   * Home, and End move between tags and the "+N" indicator, and Delete or
   * Backspace closes a focused dismissible tag.
   * @type {"tab" | "roving"}
   */
  export let navigation = "tab";

  /** Set to `true` to wrap all tags instead of collapsing to overflow. */
  export let multiline = false;

  /** Subtracted from the measured available width before fitting tags. */
  export let measurementOffset = 0;

  /** Custom element to measure instead of `TagSet`'s own wrapper.
   * @type {HTMLElement | undefined}
   */
  export let containingElement = undefined;

  /**
   * Size of every tag, including the "+N" overflow indicator. Applies to
   * slotted `Tag` children without their own `size`.
   * Also accepts Carbon v11's `"md"` (`"default"`).
   * @type {"xs" | "sm" | "default" | "lg" | "md" | undefined}
   */
  export let size = undefined;

  /**
   * Spacing between tags. Accepts a Carbon layout scale (`0`–`13`) or a CSS
   * length string.
   * @type {import("../Stack/Stack.svelte").StackScale | string}
   */
  export let gap = 3;

  /**
   * Set an id for the top-level element.
   * The overflow tooltip id derives from it as `{id}-overflow`.
   */
  export let id = uniqueId();

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import Stack from "../Stack/Stack.svelte";
  import { batchStoreUpdates } from "../utils/batch-store-updates.js";
  import { returnFocus } from "../utils/focus.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { noop } from "../utils/noop.js";
  import { observeDomOrder } from "../utils/observe-dom-order.js";
  import { rafThrottle } from "../utils/raf-throttle.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { normalizeSize, TAG_SIZE_ALIASES } from "../utils/size-aliases.js";
  import {
    insertByDomOrder,
    sortByDomOrder,
  } from "../utils/sort-by-dom-order.js";
  import { getVisibleTagCount } from "../utils/tag-overflow.js";
  import { uniqueId } from "../utils/unique-id.js";
  import TagSetAllTags from "./TagSetAllTags.svelte";
  import TagSetOverflow from "./TagSetOverflow.svelte";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /** @type {import("svelte/store").Writable<TagSetItem[]>} */
  const items = writable([]);
  /** @type {import("svelte/store").Writable<Set<string>>} */
  const overflowIds = writable(new Set());
  /** @type {import("svelte/store").Writable<"xs" | "sm" | "default" | "lg" | undefined>} */
  const sharedSize = writable(normalizeSize(size, TAG_SIZE_ALIASES));
  $: sharedSize.set(normalizeSize(size, TAG_SIZE_ALIASES));
  const sharedNavigation = writable(navigation);
  $: sharedNavigation.set(navigation);

  // Roving tab stop: the registered item id (or the overflow indicator)
  // whose element is the set's single `tabindex="0"`. `null` until mounted,
  // so server-rendered tags keep their native tab order.
  const OVERFLOW_TAB_STOP = "overflow";
  /** @type {import("svelte/store").Writable<string | null>} */
  const tabStopId = writable(null);

  /**
   * The element a tag contributes to keyboard navigation: the tag itself
   * when it's a button or link, else its close button. Skips the truncation
   * tooltip trigger inside a capped-width label.
   * @type {(node: HTMLElement | undefined) => HTMLElement | null}
   */
  function focusableIn(node) {
    if (!node) return null;
    if (node.matches("button:not(:disabled), a[href]")) return node;
    return node.querySelector(".bx--tag__close-icon:not(:disabled)");
  }

  /** Polite live region text after a tag is removed. */
  let liveAnnouncement = "";

  function handleTagClose(item) {
    const index = $items.indexOf(item);
    // Closing usually removes the tag, unmounting its focused close button.
    // Hand focus to the next visible tag, else the previous one, else the
    // overflow trigger, instead of letting it fall to <body>.
    const hadFocus = item.node?.contains(document.activeElement);
    const neighbours = hadFocus
      ? [...$items.slice(index + 1), ...$items.slice(0, index).reverse()]
          .filter((other) => !$overflowIds.has(other.id))
          .map((other) => focusableIn(other.node))
      : [];

    dispatch("close:tag", { tag: item, index });

    tick().then(() => {
      // The consumer decides whether the tag goes away; only announce a
      // removal that happened.
      if (item.node?.isConnected) return;
      liveAnnouncement = item.label
        ? `Filter ${item.label} removed`
        : "Filter removed";
      if (!hadFocus) return;
      returnFocus(
        [...neighbours, overflowTriggerRef].find((el) => el?.isConnected),
      );
    });
  }

  // Route register, unregister, and update through the same batched queue.
  // Mixing in a direct items.update() would read a stale array still
  // missing not-yet-flushed registrations.
  const batchedItemsUpdate = batchStoreUpdates(items);

  setContext("carbon:TagSet", {
    items,
    overflowIds,
    size: sharedSize,
    navigation: sharedNavigation,
    tabStopId,
    /** @param {TagSetItem} item */
    register: (item) => {
      batchedItemsUpdate((current) =>
        current.some((existing) => existing.id === item.id)
          ? current
          : insertByDomOrder(current, item),
      );
    },
    /** @param {string} id */
    unregister: (id) => {
      batchedItemsUpdate((current) => current.filter((item) => item.id !== id));
    },
    /**
     * @param {string} id
     * @param {Partial<Omit<TagSetItem, "id">>} patch
     */
    update: (id, patch) => {
      batchedItemsUpdate((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    /** @param {string} id */
    notifyClose: (id) => {
      const item = $items.find((item) => item.id === id);
      if (item) handleTagClose(item);
    },
  });

  /** @type {null | HTMLDivElement} */
  let wrapperRef = null;
  let visibleCount = 0;

  $: overflowTags = $items.slice(visibleCount);
  $: overflowCount = overflowTags.length;
  $: overflowTooltipText = overflowTags.map((tag) => tag.label).join(", ");

  let overflowTriggerRef = null;
  let overflowButtonRef = null;
  let overflowContentRef = null;
  let overflowOpen = false;

  /**
   * Visible tags with a focusable element, in DOM order, then the "+N"
   * indicator when it shows. Reads `visibleCount` directly so it's current
   * inside `measure()`, before the derived overflow values update.
   * @type {() => { id: string; element: HTMLElement }[]}
   */
  function rovingItems() {
    if (navigation !== "roving") return [];
    const entries = $items
      .slice(0, visibleCount)
      .map((item) => ({ id: item.id, element: focusableIn(item.node) }))
      .filter((entry) => entry.element);
    if (visibleCount < $items.length && overflowButtonRef) {
      entries.push({ id: OVERFLOW_TAB_STOP, element: overflowButtonRef });
    }
    return entries;
  }

  // Keep the tab stop on an element that's still visible and enabled, else
  // move it to the first one.
  function syncTabStop() {
    if (navigation !== "roving") {
      tabStopId.set(null);
      return;
    }
    const entries = rovingItems();
    if (entries.some((entry) => entry.id === $tabStopId)) return;
    tabStopId.set(entries[0]?.id ?? null);
  }

  // Nothing left to disclose.
  $: if (overflowCount === 0) overflowOpen = false;

  /**
   * A dismissible tag in the overflow popover was closed. Click the hidden
   * original's close button, so its own `close` fires before `close:tag`, as
   * it would from the row. The indicator keeps focus among the remaining
   * popover tags.
   * @param {CustomEvent<TagSetItem>} event
   */
  function handleOverflowTagClose({ detail: item }) {
    /** @type {HTMLElement | null | undefined} */ (
      item.node?.querySelector(".bx--tag__close-icon:not(:disabled)")
    )?.click();
  }

  // The popover's last tag closed while it held focus: fall back to the
  // "+N" indicator, else to the last visible tag.
  function handleOverflowEmpty() {
    const lastVisible = $items
      .slice(0, visibleCount)
      .map((other) => focusableIn(other.node))
      .filter(Boolean)
      .pop();
    returnFocus(visibleCount < $items.length ? overflowButtonRef : lastVisible);
  }

  /** @param {FocusEvent} event */
  function handleFocusIn(event) {
    const entry = rovingItems().find((entry) => entry.element === event.target);
    if (entry) tabStopId.set(entry.id);
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.key !== "Delete" && event.key !== "Backspace") return;
    // A held key would close tag after tag as focus moves to the next one.
    if (event.repeat || event.defaultPrevented || hasModifierKey(event)) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches(".bx--tag__close-icon")) return;
    if (!rovingItems().some((entry) => entry.element === target)) return;
    event.preventDefault();
    // Same path as a pointer click, so the tag's own `close` fires too.
    target.click();
  }

  // False until the first measure, as in the server's markup: a one-line
  // set clips its tags to its width until it knows how many fit.
  let measured = false;

  function measure() {
    if (multiline) {
      visibleCount =
        maxVisible == null
          ? $items.length
          : Math.min($items.length, maxVisible);
    } else {
      const measureRoot = containingElement || wrapperRef;
      if (!measureRoot) return;

      const availableWidth = Math.max(
        0,
        measureRoot.offsetWidth - measurementOffset,
      );
      const tagWidths = $items.map((item) => item.node?.offsetWidth ?? 0);
      const overflowWidth = overflowTriggerRef?.offsetWidth ?? 0;

      visibleCount = getVisibleTagCount({
        tagWidths,
        availableWidth,
        overflowWidth,
        maxVisible,
      });
    }

    overflowIds.set(new Set($items.slice(visibleCount).map((item) => item.id)));
    syncTabStop();
    measured = true;
  }

  const throttledMeasure = rafThrottle(measure);

  onMount(() => {
    // Tags register in a batched microtask after mount, so `$items` is almost
    // always empty here and there is nothing to measure yet. Reading
    // `offsetWidth` regardless forces a synchronous layout for every TagSet on
    // the page; the re-measure below runs once the tags are registered.
    if ($items.length > 0) measure();

    const stops = [wrapperRef, containingElement].map((element) =>
      element ? observeResize(element, () => throttledMeasure()) : noop,
    );
    // A keyed reorder moves tags without re-registering them. Registered ids
    // aren't the tags' DOM ids, so compare by each node's own id.
    stops.push(
      observeDomOrder(wrapperRef, {
        selector: ".bx--tag",
        getItems: () => $items.map((item) => ({ id: item.node?.id })),
        onReorder: () => batchedItemsUpdate(sortByDomOrder),
      }),
    );

    return () => {
      for (const stop of stops) stop();
      throttledMeasure.cancel();
    };
  });

  // Re-measure whenever the registered tags, `maxVisible`, or `multiline`
  // change, after the DOM settles from that change.
  $: {
    $items;
    maxVisible;
    multiline;
    navigation;
    if (wrapperRef) tick().then(measure);
  }

  let prevDispatchedOverflowCount = 0;
  $: if (overflowCount !== prevDispatchedOverflowCount) {
    const next = overflowCount;
    prevDispatchedOverflowCount = next;
    tick().then(() => {
      dispatch("overflow:change", { count: next });
    });
  }

  $: resolvedOverflowType =
    overflowType ?? (overflowMode === "popover" ? "tag" : "default");
  $: hasViewAll = overflowCount > viewAllThreshold;
  // Keep the modal mounted while open, even if closing tags drops the
  // count back under the threshold.
  $: mountAllTags = hasViewAll || allTagsOpen;

  let allTagsQuery = "";
  let allTagsListRef = null;
  $: allTagsMatches = allTagsOpen
    ? filterTags($items, allTagsQuery.trim().toLocaleLowerCase())
    : [];
  // A fresh search each time the modal opens.
  $: if (!allTagsOpen) allTagsQuery = "";

  /**
   * @param {TagSetItem[]} tags
   * @param {string} query
   */
  function filterTags(tags, query) {
    if (!query) return tags;
    return tags.filter((tag) => tag.label.toLocaleLowerCase().includes(query));
  }

  function openAllTags() {
    // The modal returns focus to what had it on open. The popover's
    // "View all" button is about to unmount, so hand that to "+N" first.
    overflowButtonRef?.focus();
    overflowOpen = false;
    allTagsOpen = true;
  }

  /**
   * A dismissible tag in the modal was closed: close the original, as the
   * popover does, then keep focus in the list.
   * @param {TagSetItem} item
   */
  function handleAllTagsClose(item) {
    const position = allTagsMatches.indexOf(item);
    const hadFocus = allTagsListRef?.contains(document.activeElement);
    handleOverflowTagClose(
      /** @type {CustomEvent<TagSetItem>} */ ({ detail: item }),
    );
    if (!hadFocus) return;
    tick().then(() => {
      if (item.node?.isConnected) return;
      const buttons = Array.from(
        allTagsListRef?.querySelectorAll(
          ".bx--tag__close-icon:not(:disabled)",
        ) ?? [],
      );
      returnFocus(
        /** @type {HTMLElement | undefined} */ (
          buttons[Math.min(position, buttons.length - 1)]
        ) ?? allTagsListRef?.closest(".bx--modal")?.querySelector("input"),
        allTagsListRef,
      );
    });
  }

  function handleTriggerClick() {
    const proceed = dispatch(
      "click:overflow",
      { count: overflowCount },
      { cancelable: true },
    );
    if (proceed && overflowMode === "tooltip" && hasViewAll) openAllTags();
  }
</script>

<div
  bind:this={wrapperRef}
  {id}
  use:rovingFocus={{
    selector: "button, a[href]",
    rtl: () => resolveLayoutDirection($layoutDirection, wrapperRef) === "rtl",
    getItems: () => rovingItems().map((entry) => entry.element),
    getActiveIndex: () =>
      Math.max(
        0,
        rovingItems().findIndex((entry) => entry.id === $tabStopId),
      ),
    onMove: (index, event) => {
      if (hasModifierKey(event)) return;
      const entry = rovingItems()[index];
      tabStopId.set(entry?.id ?? null);
      entry?.element.focus();
    },
    focusOnMove: false,
    wrap: false,
    itemsOnly: true,
  }}
  class:bx--tag-set={true}
  class:bx--tag-set--unmeasured={!multiline && !measured}
  {...$$restProps}
  on:focusin={handleFocusIn}
  on:keydown={handleKeydown}
>
  <Stack
    orientation="horizontal"
    align="center"
    {gap}
    wrap={multiline ? "wrap" : "nowrap"}
    justify={align === "start"
      ? "start"
      : align === "center"
        ? "center"
        : "end"}
    class="bx--tag-set__space"
  >
    <slot />
    <TagSetOverflow
      bind:triggerRef={overflowTriggerRef}
      bind:buttonRef={overflowButtonRef}
      bind:contentRef={overflowContentRef}
      bind:open={overflowOpen}
      mode={overflowMode}
      type={resolvedOverflowType}
      {viewAllThreshold}
      {viewAllText}
      customContent={!!$$slots.overflowTooltip}
      tabindex={$tabStopId === null
        ? undefined
        : $tabStopId === OVERFLOW_TAB_STOP
          ? "0"
          : "-1"}
      id="{id}-overflow"
      count={overflowCount}
      tags={overflowTags}
      {overflowAlign}
      {overflowDirection}
      {overflowLabel}
      size={$sharedSize}
      on:trigger={handleTriggerClick}
      on:close={handleOverflowTagClose}
      on:empty={handleOverflowEmpty}
      on:viewall={openAllTags}
    >
      <svelte:fragment slot="tooltip" let:tags let:count>
        <slot name="overflowTooltip" {tags} {count}>
          {overflowTooltipText}
        </slot>
      </svelte:fragment>
    </TagSetOverflow>
  </Stack>
  <div aria-live="polite" aria-atomic="true" class:bx--visually-hidden={true}>
    {liveAnnouncement}
  </div>
</div>

{#if mountAllTags}
  <TagSetAllTags
    bind:open={allTagsOpen}
    bind:listRef={allTagsListRef}
    bind:query={allTagsQuery}
    tags={allTagsMatches}
    closable={resolvedOverflowType === "tag"}
    title={allTagsTitle}
    searchLabel={allTagsSearchLabel}
    resultsLabel={allTagsResultsLabel}
    size={$sharedSize}
    on:close={({ detail }) => handleAllTagsClose(detail)}
  />
{/if}
