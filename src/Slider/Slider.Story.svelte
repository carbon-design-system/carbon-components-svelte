<script>
  export let story = undefined;

  import Slider from "./Slider.svelte";
  import SliderSkeleton from "./Slider.Skeleton.svelte";

  $: value = 50;
</script>

{#if story === 'skeleton'}
  <SliderSkeleton {...$$props} />
{:else}
  <Slider
    {...$$props}
    id="slider-id"
    bind:value
    on:change="{({ detail }) => {
      console.log('on:change', detail);
    }}" />
{/if}
