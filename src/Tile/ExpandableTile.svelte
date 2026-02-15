<script>
  /** Set to `true` to expand the tile */
  export let expanded = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Specify the max height of the tile  (number of pixels) */
  export let tileMaxHeight = 0;

  /** Specify the padding of the tile (number of pixels) */
  export let tilePadding = 0;

  /** Specify the icon text of the collapsed tile */
  export let tileCollapsedIconText = "Interact to expand Tile";

  /** Specify the icon text of the expanded tile */
  export let tileExpandedIconText = "Interact to collapse Tile";

  /** Specify the icon label of the expanded tile */
  export let tileExpandedLabel = "";

  /** Specify the icon label of the collapsed tile */
  export let tileCollapsedLabel = "";

  /** Specify the tabindex */
  export let tabindex = "0";

  /** Set an id for the top-level div element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /** Obtain a reference to the top-level element */
  export let ref = null;

  import { afterUpdate, onMount, tick } from "svelte";
  import ChevronDown from "../icons/ChevronDown.svelte";

  const INTERACTIVE_SELECTOR =
    "a[href],button,input,select,textarea,[tabindex],[role]";

  let refAbove = null;
  let interactive = false;

  function hasInteractiveContent(element) {
    if (!element) return false;
    return element.querySelector(INTERACTIVE_SELECTOR) !== null;
  }

  onMount(async () => {
    interactive = hasInteractiveContent(refAbove);
    await tick();

    const resizeObserver = new ResizeObserver(([elem]) => {
      tileMaxHeight = elem.contentRect.height;
    });

    if (refAbove) {
      resizeObserver.observe(refAbove);
    }

    return () => {
      resizeObserver.disconnect();
    };
  });

  afterUpdate(() => {
    if (!ref) return;

    if (tileMaxHeight === 0 && refAbove) {
      tileMaxHeight = refAbove.getBoundingClientRect().height;
    }

    const style = getComputedStyle(ref);

    tilePadding =
      Number.parseInt(style.getPropertyValue("padding-top"), 10) +
      Number.parseInt(style.getPropertyValue("padding-bottom"), 10);
  });
</script>

{#if interactive}
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={ref}
    {id}
    class:bx--tile={true}
    class:bx--tile--expandable={true}
    class:bx--tile--expandable--interactive={true}
    class:bx--tile--is-expanded={expanded}
    class:bx--tile--light={light}
    style:max-height={expanded ? "none" : `${tileMaxHeight + tilePadding}px`}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <div>
      <div bind:this={refAbove} class:bx--tile-content={true}>
        <span class:bx--tile-content__above-the-fold={true}>
          <slot name="above" />
        </span>
      </div>
      <button
        type="button"
        class:bx--tile__chevron={true}
        class:bx--tile__chevron--interactive={true}
        aria-expanded={expanded}
        title={expanded ? tileExpandedIconText : tileCollapsedIconText}
        on:click={() => {
          expanded = !expanded;
        }}
      >
        <span>{expanded ? tileExpandedLabel : tileCollapsedLabel}</span>
        <ChevronDown />
      </button>
      <div class:bx--tile-content={true}>
        <span class:bx--tile-content__below-the-fold={true}>
          <slot name="below" />
        </span>
      </div>
    </div>
  </div>
{:else}
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <button
    bind:this={ref}
    type="button"
    {id}
    aria-expanded={expanded}
    {tabindex}
    title={expanded ? tileExpandedIconText : tileCollapsedIconText}
    class:bx--tile={true}
    class:bx--tile--expandable={true}
    class:bx--tile--is-expanded={expanded}
    class:bx--tile--light={light}
    style:max-height={expanded ? "none" : `${tileMaxHeight + tilePadding}px`}
    {...$$restProps}
    on:click
    on:click={() => {
      expanded = !expanded;
    }}
    on:keypress
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <div>
      <div bind:this={refAbove} class:bx--tile-content={true}>
        <span class:bx--tile-content__above-the-fold={true}>
          <slot name="above" />
        </span>
      </div>
      <div class:bx--tile__chevron={true}>
        <span>{expanded ? tileExpandedLabel : tileCollapsedLabel}</span>
        <ChevronDown />
      </div>
      <div class:bx--tile-content={true}>
        <span class:bx--tile-content__below-the-fold={true}>
          <slot name="below" />
        </span>
      </div>
    </div>
  </button>
{/if}
