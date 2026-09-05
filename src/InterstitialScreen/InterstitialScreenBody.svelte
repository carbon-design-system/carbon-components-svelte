<script>
  /**
   * Obtain a reference to the scrollable body element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import ModalBody from "../ComposedModal/ModalBody.svelte";
  import { initCarousel } from "../utils/carousel.js";

  const { isFullScreen, progStep, views, handleGotoStep } = getContext(
    "carbon:InterstitialScreen",
  );

  $: isMultiStep = $views.length > 1;

  let carouselContainer = null;
  /** @type {import("../utils/carousel.js").Carousel | null} */
  let carousel = null;

  function teardownCarousel() {
    carousel?.destroyEvents();
    carousel = null;
  }

  $: {
    teardownCarousel();
    if (isMultiStep && carouselContainer) {
      carousel = initCarousel(carouselContainer, {
        useMaxHeight: true,
        onViewChangeEnd: ({ currentIndex }) => {
          handleGotoStep(currentIndex);
        },
      });
    }
  }

  // Footer-driven navigation (Back/Next) sets `progStep` directly; only the
  // carousel's own transitions report back through `onViewChangeEnd`, so an
  // externally-set step has to be pushed into the carousel here.
  $: carousel?.goToIndex($progStep);

  $: if ($progStep >= 0) ref?.scroll?.({ top: 0 });

  onMount(() => teardownCarousel);
</script>

{#if $isFullScreen}
  <div
    bind:this={ref}
    class:bx--interstitial-screen__body={true}
    {...$$restProps}
  >
    <div
      bind:this={carouselContainer}
      class:bx--interstitial-screen__carousel={isMultiStep}
    >
      <slot />
    </div>
  </div>
{:else}
  <ModalBody
    bind:ref
    hasScrollingContent
    class="bx--interstitial-screen__body"
    {...$$restProps}
  >
    <div
      bind:this={carouselContainer}
      class:bx--interstitial-screen__carousel={isMultiStep}
    >
      <slot />
    </div>
  </ModalBody>
{/if}
