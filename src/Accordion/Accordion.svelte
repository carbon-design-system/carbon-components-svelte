<script>
  /** @extendProps {"./AccordionSkeleton.svelte"} AccordionSkeletonProps */

  /**
   * Specify alignment of accordion item chevron icon.
   * @type {"start" | "end"}
   */
  export let align = "end";

  /**
   * Specify the size of the accordion.
   * Also accepts Carbon v11's `"md"` (the 40px default) and `"lg"` (`"xl"`).
   * @type {"sm" | "md" | "lg" | "xl" | undefined}
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

  import { onMount, setContext } from "svelte";
  import { get, writable } from "svelte/store";
  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import AccordionSkeleton from "./AccordionSkeleton.svelte";

  $: effectiveSize = normalizeSize(size, FIELD_SIZE_ALIASES);

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

  /**
   * @param {object} id
   * @returns {void}
   */
  function notifyOpen(id) {
    if (type === "single") {
      openId.set(id);
    }
  }

  /**
   * @param {object} id
   * @returns {boolean}
   */
  function claimSingle(id) {
    const currentId = get(openId);
    if (currentId === null) {
      openId.set(id);
      return true;
    }
    return currentId === id;
  }

  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  /** @returns {boolean} */
  function isMounted() {
    return mounted;
  }

  setContext("carbon:Accordion", {
    disableItems,
    openId,
    typeStore,
    notifyOpen,
    claimSingle,
    isMounted,
  });
</script>

{#if skeleton}
  <AccordionSkeleton
    {...$$restProps}
    {align}
    size={effectiveSize}
    {flush}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <ul
    class:bx--accordion={true}
    class:bx--accordion--start={align === "start"}
    class:bx--accordion--end={align === "end"}
    class:bx--accordion--sm={effectiveSize === "sm"}
    class:bx--accordion--xl={effectiveSize === "xl"}
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
