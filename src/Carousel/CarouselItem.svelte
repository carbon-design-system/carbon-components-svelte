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

  const { views } = getContext("carbon:Carousel") ?? { views: readable([]) };

  let node = null;

  // `views` is a fresh array of the viewport's children on every add, remove,
  // or reorder, so the position stays in sync without measuring the DOM here.
  $: position = node ? $views.indexOf(node) : -1;
</script>

<div
  bind:this={node}
  class:bx--carousel__item={true}
  role="group"
  aria-roledescription="slide"
  aria-label={label ?? `Slide ${position + 1} of ${$views.length}`}
  {...$$restProps}
>
  <slot />
</div>
