<script lang="ts">
  import Carousel from "carbon-components-svelte/Carousel/Carousel.svelte";
  import CarouselItem from "carbon-components-svelte/Carousel/CarouselItem.svelte";
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";

  export let dir: "ltr" | "rtl" = "rtl";
  export let context = true;

  let selectedIndex = 1;
</script>

{#if context}
  <LayoutDirection {dir}>
    <Carousel bind:selectedIndex>
      <CarouselItem>Slide one</CarouselItem>
      <CarouselItem>Slide two</CarouselItem>
      <CarouselItem>Slide three</CarouselItem>
    </Carousel>
  </LayoutDirection>
{:else}
  <Carousel bind:selectedIndex>
    <CarouselItem>Slide one</CarouselItem>
    <CarouselItem>Slide two</CarouselItem>
    <CarouselItem>Slide three</CarouselItem>
  </Carousel>
{/if}

<div data-testid="selected-index">{selectedIndex}</div>
