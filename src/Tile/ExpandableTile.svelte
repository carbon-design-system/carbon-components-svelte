<script>
  /**
   * @event {{ expanded: boolean }} toggle - Dispatched with the next expanded state when the user toggles the tile. Call `preventDefault()` to keep the current state.
   */

  /**
   * Set to `true` to expand the tile.
   * @bindable writable
   */
  export let expanded = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /**
   * Specify the collapsed height of the above-the-fold content (number of
   * pixels). Overrides the measured height when greater than 0.
   */
  export let tileMaxHeight = 0;

  /**
   * Specify the vertical padding of the tile (number of pixels).
   * Overrides the measured padding when greater than 0.
   */
  export let tilePadding = 0;

  /** Specify the icon text of the collapsed tile */
  export let tileCollapsedIconText = "Interact to expand Tile";

  /** Specify the icon text of the expanded tile */
  export let tileExpandedIconText = "Interact to collapse Tile";

  /** Specify the icon label of the expanded tile */
  export let tileExpandedLabel = "";

  /** Specify the icon label of the collapsed tile */
  export let tileCollapsedLabel = "";

  /**
   * Specify the tabindex of the toggle: the tile itself, or the
   * chevron button when `hasInteractiveContent` is `true`.
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /** Set an id for the top-level element */
  export let id = uniqueId();

  /**
   * Set to `true` if the tile contains interactive content
   * (e.g., links, buttons, inputs). The tile will render as
   * a `div` instead of a `button` to avoid invalid HTML nesting,
   * and the expand/collapse toggle moves to the chevron button.
   */
  export let hasInteractiveContent = false;

  /**
   * Obtain a reference to the top-level element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount } from "svelte";
  import { writable } from "svelte/store";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import { uniqueId } from "../utils/unique-id.js";
  import TileWrapper from "./TileWrapper.svelte";

  const dispatch = createEventDispatcher();

  let refAbove = null;
  let resizeObserver;

  /**
   * Internal, measured fallbacks. These are only used when the consumer has
   * not explicitly set the corresponding public prop, so that `bind:` values
   * used to *control* the layout are never clobbered by measurements.
   */
  let measuredMaxHeight = 0;
  let measuredPadding = 0;

  /**
   * Read the tile's vertical padding. `getComputedStyle` forces a style
   * recalc, so this runs when the tile mounts or resizes rather than in
   * `afterUpdate`, which fired on every re-render (hover, slot content).
   */
  function measurePadding() {
    if (!ref) return;
    const style = getComputedStyle(ref);
    measuredPadding =
      (Number.parseInt(style.getPropertyValue("padding-top"), 10) || 0) +
      (Number.parseInt(style.getPropertyValue("padding-bottom"), 10) || 0);
  }

  onMount(() => {
    // Measure synchronously so the first frame has a height, rather than
    // waiting for the observer's first report.
    if (refAbove) measuredMaxHeight = refAbove.getBoundingClientRect().height;
    measurePadding();
    if (typeof ResizeObserver === "undefined") return;

    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === refAbove) {
          measuredMaxHeight = entry.contentRect.height;
        } else if (entry.target === ref) {
          measurePadding();
        }
      }
    });

    return () => {
      resizeObserver.disconnect();
    };
  });

  $: if (resizeObserver) {
    resizeObserver.disconnect();
    if (refAbove) resizeObserver.observe(refAbove);
    if (ref) resizeObserver.observe(ref);
  }

  function toggle() {
    const next = !expanded;
    if (dispatch("toggle", { expanded: next }, { cancelable: true })) {
      expanded = next;
    }
  }

  $: iconText = expanded ? tileExpandedIconText : tileCollapsedIconText;
  $: label = expanded ? tileExpandedLabel : tileCollapsedLabel;
  $: effectiveMaxHeight = tileMaxHeight > 0 ? tileMaxHeight : measuredMaxHeight;
  $: effectivePadding = tilePadding > 0 ? tilePadding : measuredPadding;

  /** @type {import("svelte/store").Writable<undefined | "active" | "revert">} */
  const aiLabelState = writable(undefined);
</script>

<TileWrapper
  decorated={$$slots.decorator}
  state={aiLabelState}
  class="bx--tile__wrapper--expandable"
>
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <svelte:element
    this={hasInteractiveContent ? "div" : "button"}
    bind:this={ref}
    type={hasInteractiveContent ? undefined : "button"}
    {id}
    aria-expanded={hasInteractiveContent ? undefined : expanded}
    tabindex={hasInteractiveContent ? undefined : tabindex}
    title={hasInteractiveContent ? undefined : iconText}
    class:bx--tile={true}
    class:bx--tile--expandable={true}
    class:bx--tile--expandable--interactive={hasInteractiveContent}
    class:bx--tile--is-expanded={expanded}
    class:bx--tile--light={light}
    class:bx--tile--decorator={$$slots.decorator}
    class:bx--tile--ai-label={$aiLabelState === "active"}
    style:max-height={expanded || effectiveMaxHeight <= 0
      ? "none"
      : `${effectiveMaxHeight + effectivePadding}px`}
    {...$$restProps}
    on:click
    on:click={() => {
      if (!hasInteractiveContent) toggle();
    }}
    on:keydown
    on:keypress
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:focus
    on:blur
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
        tabindex={hasInteractiveContent ? tabindex : undefined}
        class:bx--tile__chevron={true}
        aria-expanded={hasInteractiveContent ? expanded : undefined}
        aria-label={hasInteractiveContent && !label ? iconText : undefined}
        aria-controls={hasInteractiveContent ? `${id}-content` : undefined}
        title={hasInteractiveContent ? iconText : undefined}
        on:click={() => {
          if (hasInteractiveContent) toggle();
        }}
        on:focus
        on:blur
      >
        <span>{label}</span>
        <ChevronDown />
      </svelte:element>
      <div class:bx--tile-content={true}>
        <span id="{id}-content" class:bx--tile-content__below-the-fold={true}>
          <slot name="below" />
        </span>
      </div>
    </div>
  </svelte:element>
  <svelte:fragment slot="decorator">
    <slot name="decorator" />
  </svelte:fragment>
</TileWrapper>
