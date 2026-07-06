<script>
  /**
   * @typedef {Object} TagSetItem
   * @property {string} id
   * @property {HTMLElement} node
   * @property {string} label
   * @property {string} [type]
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
   * @event {{ count: number }} click:overflow - User clicks the "+N" indicator.
   * @event {{ count: number }} overflow:change - Dispatched when the number of overflowing tags changes, from a resize, a slotted-children change, or a `maxVisible` change.
   * @slot {{ tags: TagSetItem[]; count: number }} overflowTooltip - Override the "+N" indicator's tooltip content. Defaults to a comma-separated list of the hidden labels.
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

  /** Hard cap on visible tags regardless of available space.
   * @type {number | undefined}
   */
  export let maxVisible = undefined;

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
   * @type {"sm" | "default" | "lg"}
   */
  export let size = undefined;

  /**
   * Spacing between tags. Accepts a Carbon layout scale (`0`–`13`) or a CSS
   * length string.
   * @type {import("../Stack/Stack.svelte").StackScale | string}
   */
  export let gap = 3;

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import Stack from "../Stack/Stack.svelte";
  import { rafThrottle } from "../utils/rafThrottle.js";
  import { getVisibleTagCount } from "../utils/tagOverflow.js";
  import TagSetOverflow from "./TagSetOverflow.svelte";

  const dispatch = createEventDispatcher();

  /** @type {import("svelte/store").Writable<TagSetItem[]>} */
  const items = writable([]);
  /** @type {import("svelte/store").Writable<Set<string>>} */
  const overflowIds = writable(new Set());
  const sizeStore = writable(size);
  $: sizeStore.set(size);

  // Tags register in mount order, which differs from DOM order when they are
  // conditionally rendered. Sort by document position right at registration
  // time so the fit calculation and overflow tooltip track the rendered
  // layout, mirroring `UserAvatarGroup`'s own registry.
  function sortByDomOrder(list) {
    return [...list].sort((a, b) => {
      if (!a.node || !b.node) return 0;
      const position = a.node.compareDocumentPosition(b.node);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
  }

  function handleTagClose(item) {
    dispatch("close:tag", { tag: item, index: $items.indexOf(item) });
  }

  setContext("carbon:TagSet", {
    items,
    overflowIds,
    size: sizeStore,
    register: (item) => {
      items.update((current) =>
        current.some((existing) => existing.id === item.id)
          ? current
          : sortByDomOrder([...current, item]),
      );
    },
    unregister: (id) => {
      items.update((current) => current.filter((item) => item.id !== id));
    },
    update: (id, patch) => {
      items.update((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    notifyClose: (id) => {
      const item = $items.find((item) => item.id === id);
      if (item) handleTagClose(item);
    },
  });

  let wrapperRef = null;
  let visibleCount = 0;

  $: overflowTags = $items.slice(visibleCount);
  $: overflowCount = overflowTags.length;
  $: overflowTooltipText = overflowTags.map((tag) => tag.label).join(", ");

  let overflowTriggerRef = null;

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
  }

  const throttledMeasure = rafThrottle(measure);

  onMount(() => {
    measure();

    const observer = new ResizeObserver(throttledMeasure);
    if (wrapperRef) observer.observe(wrapperRef);
    if (containingElement) observer.observe(containingElement);

    return () => {
      observer.disconnect();
      throttledMeasure.cancel();
    };
  });

  // Re-measure whenever the registered tags, `maxVisible`, or `multiline`
  // change, after the DOM settles from that change.
  $: {
    $items;
    maxVisible;
    multiline;
    if (wrapperRef) tick().then(measure);
  }

  let lastDispatchedOverflowCount = 0;
  $: if (overflowCount !== lastDispatchedOverflowCount) {
    const next = overflowCount;
    lastDispatchedOverflowCount = next;
    tick().then(() => {
      dispatch("overflow:change", { count: next });
    });
  }

  function handleTriggerClick() {
    dispatch("click:overflow", { count: overflowCount });
  }
</script>

<div bind:this={wrapperRef} class:bx--tag-set={true} {...$$restProps}>
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
      count={overflowCount}
      tags={overflowTags}
      {overflowAlign}
      {overflowDirection}
      {size}
      on:trigger={handleTriggerClick}
    >
      <svelte:fragment slot="tooltip" let:tags let:count>
        <slot name="overflowTooltip" {tags} {count}>
          {overflowTooltipText}
        </slot>
      </svelte:fragment>
    </TagSetOverflow>
  </Stack>
</div>
