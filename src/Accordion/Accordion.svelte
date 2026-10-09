<script>
  /**
   * @event {{ openCount: number }} toggle:change - Dispatched with the number of open items after it changes.
   */

  /** @extends {"./AccordionSkeleton.svelte"} AccordionSkeletonProps */

  /**
   * Specify alignment of accordion item chevron icon.
   * @type {"start" | "end"}
   */
  export let align = "end";

  /**
   * Specify the size of the accordion.
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /**
   * Set to `true` to remove the gutter around the accordion, aligning it flush with its container.
   * Has no effect when `align` is `"start"`.
   */
  export let flush = false;

  /** Set to `true` to disable the accordion */
  export let disabled = false;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

  /**
   * Specify the expansion behavior of the accordion.
   * Set to `"single"` so that opening an item closes all other items.
   * @type {"single" | "multiple"}
   */
  export let type = "multiple";

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { get, writable } from "svelte/store";
  import { rovingFocus } from "../utils/roving-focus.js";
  import AccordionSkeleton from "./AccordionSkeleton.svelte";

  const dispatch = createEventDispatcher();

  /** @type {null | HTMLUListElement} */
  let ref = null;

  function getActiveIndex() {
    if (!ref) return -1;
    const items = Array.from(ref.querySelectorAll(".bx--accordion__heading"));
    return items.indexOf(
      /** @type {Element} */ (ref.ownerDocument.activeElement),
    );
  }

  /**
   * @type {import("svelte/store").Writable<boolean>}
   */
  const disableItems = writable(disabled);

  $: disableItems.set(disabled);

  /**
   * Tracks the identity of the currently open item when `type` is `"single"`.
   * @type {import("svelte/store").Writable<object | null>}
   */
  const openId = writable(null);

  /** @type {import("svelte/store").Writable<"single" | "multiple">} */
  const typeStore = writable(type);

  $: if (type === "single") {
    openId.set(null);
  }
  $: typeStore.set(type);

  function notifyOpen(id) {
    if (type === "single") {
      openId.set(id);
    }
  }

  function claimSingle(id) {
    const currentId = get(openId);
    if (currentId === null) {
      openId.set(id);
      return true;
    }
    return currentId === id;
  }

  /**
   * Which items currently report themselves open, keyed by each item's
   * opaque identity token (the same shape as `openId`/`claimSingle`).
   * Never exposed directly; only its size is dispatched.
   * @type {import("svelte/store").Writable<Set<object>>}
   */
  const openItems = writable(new Set());

  /**
   * @param {object} id
   * @param {boolean} isOpen
   */
  function reportOpen(id, isOpen) {
    openItems.update((set) => {
      if (set.has(id) === isOpen) return set;
      const next = new Set(set);
      if (isOpen) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  $: openCount = $openItems.size;

  let mounted = false;
  let prevOpenCount = 0;
  let pendingDispatch = false;

  $: if (mounted && openCount !== prevOpenCount) {
    prevOpenCount = openCount;
    if (!pendingDispatch) {
      pendingDispatch = true;
      tick().then(() => {
        pendingDispatch = false;
        dispatch("toggle:change", { openCount });
      });
    }
  }

  onMount(() => {
    prevOpenCount = openCount;
    mounted = true;
  });

  setContext("carbon:Accordion", {
    disableItems,
    openId,
    typeStore,
    notifyOpen,
    claimSingle,
    reportOpen,
  });
</script>

{#if skeleton}
  <AccordionSkeleton
    {...$$restProps}
    {align}
    {size}
    {flush}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <ul
    bind:this={ref}
    use:rovingFocus={{
      selector: ".bx--accordion__heading",
      orientation: "vertical",
      skipDisabled: true,
      getActiveIndex,
      onMove: (_index, event) => {
        // Arrow keys would otherwise also scroll the page.
        event.preventDefault();
      },
      focusOnMove: true,
    }}
    class:bx--accordion={true}
    class:bx--accordion--start={align === "start"}
    class:bx--accordion--end={align === "end"}
    class:bx--accordion--sm={size === "sm"}
    class:bx--accordion--xl={size === "xl"}
    class:bx--accordion--flush={flush && align !== "start"}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <slot />
  </ul>
{/if}
