<script>
  /**
   * @event {{ expanded: boolean }} toggle - Dispatched with the next expanded state when the user toggles the tile. Call `preventDefault()` to keep the current state.
   * @restProps {button | div}
   */

  /**
   * Set to `true` to expand the tile.
   * @bindable writable
   */
  export let expanded = false;

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
   * Set to `true` to round the tile's corners when it has a `decorator`,
   * such as an `AILabel`. Carbon reserves rounded tiles for AI content.
   */
  export let rounded = false;

  /**
   * Specify the tabindex of the toggle: the tile itself, or the
   * chevron button when the tile has interactive content.
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /** Set an id for the top-level element */
  export let id = uniqueId();

  /**
   * Set to `true` if the tile contains interactive content, such as links,
   * buttons, or inputs. The tile renders a `div` instead of a `button` to
   * avoid invalid HTML nesting, and the chevron button becomes the toggle.
   * By default, the tile looks for interactive content once it mounts and
   * switches then. Set to `true` to render the `div` from the start, such
   * as on the server, or `false` to keep the `button` without looking.
   * @type {boolean | undefined}
   */
  export let hasInteractiveContent = undefined;

  /**
   * Obtain a reference to the top-level element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import { writable } from "svelte/store";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { noop } from "../utils/noop.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";
  import TileWrapper from "./TileWrapper.svelte";

  const dispatch = createEventDispatcher();

  // HTML's interactive content, which a `button` must not contain, plus
  // any element with a `tabindex`, which it must not contain either.
  const INTERACTIVE_CONTENT = [
    "a[href]",
    "area[href]",
    "audio[controls]",
    "button",
    "details",
    "embed",
    "iframe",
    "input:not([type='hidden'])",
    "label",
    "select",
    "textarea",
    "video[controls]",
    "[tabindex]",
    "[contenteditable]:not([contenteditable='false'])",
  ].join(", ");

  /** @type {null | HTMLDivElement} */
  let refAbove = null;
  let chevronRef = null;
  let mounted = false;
  let stopObserving = noop;
  let stopWatching = noop;
  let detectedInteractive = false;

  $: interactive = hasInteractiveContent ?? detectedInteractive;

  /**
   * Whether the button holds interactive content. The switch to the `div`
   * replaces the button and everything in it, so a focused tile hands focus
   * to the chevron button that takes over as the toggle.
   * @param {HTMLElement} node
   * @returns {boolean}
   */
  function checkContent(node) {
    if (!node.querySelector(INTERACTIVE_CONTENT)) return false;
    if (node.contains(document.activeElement)) {
      tick().then(() => chevronRef?.focus());
    }
    return true;
  }

  /**
   * Look for interactive content in the button. Content can arrive after
   * mount, so keep watching until it does. The server cannot look, so it
   * renders the `button`.
   * @param {null | HTMLElement} node
   * @returns {boolean}
   */
  function watchContent(node) {
    stopWatching();
    stopWatching = noop;
    if (!node) return false;
    if (checkContent(node)) return true;

    const observer = new MutationObserver(() => {
      if (!detectedInteractive && checkContent(node)) {
        detectedInteractive = true;
      }
    });
    observer.observe(node, {
      childList: true,
      subtree: true,
      attributeFilter: ["href", "tabindex", "contenteditable", "controls"],
    });
    stopWatching = () => observer.disconnect();
    return false;
  }

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
    mounted = true;

    return () => {
      stopObserving();
      stopWatching();
    };
  });

  // Assign here, not inside `watchContent`, so Svelte 3 and 4 order this
  // block before `interactive` and re-derive it in the same flush.
  $: if (mounted) {
    if (hasInteractiveContent === undefined && !detectedInteractive) {
      detectedInteractive = watchContent(ref);
    } else {
      watchContent(null);
    }
  }

  // Follow the elements as they change, such as when interactive content
  // swaps the root tag.
  $: if (mounted) {
    stopObserving();
    /** @type {Array<() => void>} */
    const stops = [];
    if (refAbove) {
      stops.push(
        observeResize(refAbove, (entry) => {
          measuredMaxHeight = entry.contentRect.height;
        }),
      );
    }
    if (ref) stops.push(observeResize(ref, measurePadding));
    stopObserving = () => {
      for (const stop of stops) stop();
    };
  }

  function toggle() {
    const next = !expanded;
    if (dispatch("toggle", { expanded: next }, { cancelable: true })) {
      expanded = next;
    }
  }

  // With interactive content, the chevron button is the toggle, so naming
  // and description go there instead of onto the tile `div`.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  $: iconText = expanded ? tileExpandedIconText : tileCollapsedIconText;
  $: label = expanded ? tileExpandedLabel : tileCollapsedLabel;
  $: effectiveMaxHeight = tileMaxHeight > 0 ? tileMaxHeight : measuredMaxHeight;
  $: effectivePadding = tilePadding > 0 ? tilePadding : measuredPadding;

  /**
   * Starts active for a filled slot, so the server renders the AI surface.
   * `Decorator` clears it when no `AILabel` claims the slot.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  const aiLabelState = writable($$slots.decorator ? "active" : undefined);
</script>

<TileWrapper
  decorated={$$slots.decorator}
  state={aiLabelState}
  class="bx--tile__wrapper--expandable"
>
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <svelte:element
    this={interactive ? "div" : "button"}
    bind:this={ref}
    type={interactive ? undefined : "button"}
    {id}
    aria-expanded={interactive ? undefined : expanded}
    aria-controls={interactive ? undefined : `${id}-content`}
    tabindex={interactive ? undefined : tabindex}
    title={interactive ? undefined : iconText}
    class:bx--tile={true}
    class:bx--tile--expandable={true}
    class:bx--tile--expandable--interactive={interactive}
    class:bx--tile--is-expanded={expanded}
    class:bx--tile--unmeasured={!expanded && effectiveMaxHeight <= 0}
    class:bx--tile--decorator={$$slots.decorator}
    class:bx--tile--decorator-rounded={rounded && $$slots.decorator}
    class:bx--tile--ai-label={$aiLabelState === "active"}
    style:max-height={expanded || effectiveMaxHeight <= 0
      ? "none"
      : `${effectiveMaxHeight + effectivePadding}px`}
    {...interactive ? wrapperProps : $$restProps}
    on:click
    on:click={() => {
      if (!interactive) toggle();
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
        this={interactive ? "button" : "div"}
        bind:this={chevronRef}
        type={interactive ? "button" : undefined}
        tabindex={interactive ? tabindex : undefined}
        class:bx--tile__chevron={true}
        aria-expanded={interactive ? expanded : undefined}
        aria-label={interactive
          ? (ariaLabel ?? (label ? undefined : iconText))
          : undefined}
        aria-labelledby={interactive ? ariaLabelledBy : undefined}
        aria-describedby={interactive ? ariaDescribedBy : undefined}
        aria-controls={interactive ? `${id}-content` : undefined}
        title={interactive ? iconText : undefined}
        on:click={() => {
          if (interactive) toggle();
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
