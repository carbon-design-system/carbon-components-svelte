<script>
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

  import { setContext } from "svelte";
  import { get, writable } from "svelte/store";
  import AccordionSkeleton from "./AccordionSkeleton.svelte";

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

  setContext("carbon:Accordion", {
    disableItems,
    openId,
    typeStore,
    notifyOpen,
    claimSingle,
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
