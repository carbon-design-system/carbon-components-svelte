<script lang="ts">
  import Carousel from "carbon-components-svelte/Carousel/Carousel.svelte";
  import CarouselItem from "carbon-components-svelte/Carousel/CarouselItem.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";

  export let selectedIndex = 0;
  export let showExtra = false;
  export let loaded = true;
  export let wrap = false;
  export let showCounter = false;
  export let counterText:
    ((current: number, total: number) => string) | undefined = undefined;

  export let moveFocusOnChange = false;
  export let useMaxHeight = true;
  export let single = false;
  export let guarded = false;
  export let slideLabel: string | undefined = undefined;

  let currentIndex = -1;
  let elsewhere: HTMLInputElement;
  let previousIndex = -1;
</script>

<Carousel
  data-testid="carousel"
  {wrap}
  {showCounter}
  {useMaxHeight}
  {...counterText ? { counterText } : {}}
  bind:selectedIndex
  on:change={(e) => {
    currentIndex = e.detail.currentIndex;
    previousIndex = e.detail.previousIndex;
    if (moveFocusOnChange) elsewhere.focus();
  }}
>
  {#if loaded}
    <CarouselItem label={slideLabel}>
      Slide one
      {#if guarded}
        <textarea aria-label="Notes"></textarea>
        <select aria-label="Choice">
          <option>A</option>
        </select>
        <div
          role="slider"
          tabindex="0"
          aria-label="Volume"
          aria-valuenow="1"
        ></div>
        <div role="listbox" tabindex="0" aria-label="Options"></div>
        <div role="tablist" tabindex="0" aria-label="Sections"></div>
        <div contenteditable="true" role="textbox" aria-label="Rich text"></div>
      {/if}
    </CarouselItem>
    {#if !single}
      <CarouselItem>
        Slide two
        <TextInput labelText="Name" />
      </CarouselItem>
      <CarouselItem>Slide three</CarouselItem>
    {/if}
  {/if}
  {#if showExtra}
    <CarouselItem>Slide four</CarouselItem>
  {/if}
</Carousel>

<div data-testid="current-index">{currentIndex}</div>
<div data-testid="previous-index">{previousIndex}</div>
<div data-testid="selected-index">{selectedIndex}</div>
<button type="button" on:click={() => (loaded = true)}>Load slides</button>
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

<input aria-label="Elsewhere" bind:this={elsewhere} />
