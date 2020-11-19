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

  /** Specify the tabindex */
  export let tabindex = "0";

  /** Set an id for the top-level div element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the top-level element */
  export let ref = null;

  import { afterUpdate } from "svelte";
  import ChevronDown16 from "carbon-icons-svelte/lib/ChevronDown16";

  let refContent = null;
  let refAbove = null;

  afterUpdate(() => {
    if (tileMaxHeight === 0) {
      tileMaxHeight = refAbove.getBoundingClientRect().height;
    }

    const style = getComputedStyle(ref);

    tilePadding =
      parseInt(style.getPropertyValue("padding-top"), 10) +
      parseInt(style.getPropertyValue("padding-bottom"), 10);
  });
</script>

<div
  bind:this="{ref}"
  id="{id}"
  tabindex="{tabindex}"
  class:bx--tile="{true}"
  class:bx--tile--expandable="{true}"
  class:bx--tile--is-expanded="{expanded}"
  class:bx--tile--light="{light}"
  {...$$restProps}
  style="{expanded ? $$restProps.style : `${$$restProps.style}; max-height: ${tileMaxHeight + tilePadding}px`}"
  on:click
  on:click="{() => {
    expanded = !expanded;
  }}"
  on:keypress
  on:keypress="{(e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      expanded = !expanded;
    }
  }}"
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div bind:this="{refContent}">
    <div bind:this="{refAbove}" class:bx--tile-content="{true}">
      <span
        class:bx--tile-content__above-the-fold="{true}"
        on:click
        on:mouseover
        on:mouseenter
        on:mouseleave
      >
        <slot name="above" />
      </span>
    </div>
    <button
      aria-expanded="{expanded}"
      aria-label="{expanded ? tileExpandedIconText : tileCollapsedIconText}"
      class:bx--tile__chevron="{true}"
    >
      <ChevronDown16 />
    </button>
    <div class:bx--tile-content="{true}">
      <span
        on:click
        on:mouseover
        on:mouseenter
        on:mouseleave
        class:bx--tile-content__below-the-fold="{true}"
      >
        <slot name="below" />
      </span>
    </div>
  </div>
</div>
