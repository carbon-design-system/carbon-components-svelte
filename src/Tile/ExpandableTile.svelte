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

  /**
   * Set to `true` if the tile contains interactive content
   * (e.g., links, buttons, inputs). The tile will render as
   * a `div` instead of a `button` to avoid invalid HTML nesting,
   * and the expand/collapse toggle moves to the chevron button.
   */
  export let hasInteractiveContent = false;

  /** Obtain a reference to the top-level element */
  export let ref = null;

  import { afterUpdate, onMount } from "svelte";
  import ChevronDown from "../icons/ChevronDown.svelte";

  let refAbove = null;

  onMount(() => {
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

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<svelte:element
  this={hasInteractiveContent ? "div" : "button"}
  bind:this={ref}
  type={hasInteractiveContent ? undefined : "button"}
  {id}
  aria-expanded={hasInteractiveContent ? undefined : expanded}
  tabindex={hasInteractiveContent ? undefined : tabindex}
  title={hasInteractiveContent ? undefined : (expanded ? tileExpandedIconText : tileCollapsedIconText)}
  class:bx--tile={true}
  class:bx--tile--expandable={true}
  class:bx--tile--is-expanded={expanded}
  class:bx--tile--light={light}
  style:max-height={expanded || tileMaxHeight <= 0 ? "none" : `${tileMaxHeight + tilePadding}px`}
  {...$$restProps}
  on:click
  on:click={() => {
    if (!hasInteractiveContent) expanded = !expanded;
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
    <svelte:element
      this={hasInteractiveContent ? "button" : "div"}
      type={hasInteractiveContent ? "button" : undefined}
      class:bx--tile__chevron={true}
      aria-expanded={hasInteractiveContent ? expanded : undefined}
      title={hasInteractiveContent ? (expanded ? tileExpandedIconText : tileCollapsedIconText) : undefined}
      on:click={() => {
        if (hasInteractiveContent) expanded = !expanded;
      }}
    >
      <span>{expanded ? tileExpandedLabel : tileCollapsedLabel}</span>
      <ChevronDown />
    </svelte:element>
    <div class:bx--tile-content={true}>
      <span class:bx--tile-content__below-the-fold={true}>
        <slot name="below" />
      </span>
    </div>
  </div>
</svelte:element>
