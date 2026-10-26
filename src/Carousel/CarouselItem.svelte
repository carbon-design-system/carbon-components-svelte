<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Override the accessible label for this slide. Defaults to
   * `"Slide {position} of {total}"`, computed from this item's position
   * among its siblings.
   * @type {string | undefined}
   */
  export let label = undefined;

  import { getContext } from "svelte";
  import { readable } from "svelte/store";

  const { views, active, stacked, claimSlide } = getContext(
    "carbon:Carousel",
  ) ?? {
    views: readable([]),
    active: readable(-1),
    stacked: readable(false),
  };

  // This slide's position before `views` knows it (see `claimSlide`).
  const claimed = claimSlide?.() ?? -1;

  /** @type {null | HTMLDivElement} */
  let node = null;

  // `views` is a fresh array of the viewport's children on every add, remove,
  // or reorder, so the position stays in sync without measuring the DOM here.
  $: position = node ? $views.indexOf(node) : -1;

  // The same `hidden` the carousel sets, so the server's markup shows only
  // the active slide and a re-render never undoes the carousel's own.
  $: index = position < 0 ? claimed : position;
  $: inactive = index >= 0 && index !== $active;
  // Stacked slides stay in the layout, invisible, until the carousel mounts.
  $: hidden = inactive && !$stacked;
</script>

<div
  bind:this={node}
  class:bx--carousel__item={true}
  class:bx--carousel__item--stacked={inactive && $stacked}
  role="group"
  aria-roledescription="slide"
  aria-label={label ??
    (position < 0 ? undefined : `Slide ${position + 1} of ${$views.length}`)}
  hidden={hidden || undefined}
  {...$$restProps}
>
  <slot />
</div>
