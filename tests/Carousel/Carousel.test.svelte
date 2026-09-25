<script lang="ts">
  import Carousel from "carbon-components-svelte/Carousel/Carousel.svelte";
  import CarouselItem from "carbon-components-svelte/Carousel/CarouselItem.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";

  export let selectedIndex = 0;
  export let showExtra = false;

  let currentIndex = -1;
</script>

<Carousel
  data-testid="carousel"
  bind:selectedIndex
  on:change={(e) => (currentIndex = e.detail.currentIndex)}
>
  <CarouselItem>Slide one</CarouselItem>
  <CarouselItem>
    Slide two
    <TextInput labelText="Name" />
  </CarouselItem>
  <CarouselItem>Slide three</CarouselItem>
  {#if showExtra}
    <CarouselItem>Slide four</CarouselItem>
  {/if}
</Carousel>

<div data-testid="current-index">{currentIndex}</div>
<div data-testid="selected-index">{selectedIndex}</div>
<button type="button" on:click={() => (showExtra = true)}>Add slide</button>
<button
  type="button"
  on:click={() => {
    showExtra = true;
    selectedIndex = 3;
  }}
>
  Add and select slide
</button>
