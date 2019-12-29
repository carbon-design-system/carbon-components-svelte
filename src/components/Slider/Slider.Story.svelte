<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import Slider from './Slider.svelte';
  import SliderSkeleton from './Slider.Skeleton.svelte';

  let value = 50;
</script>

<Layout>
  {#if story === 'skeleton'}
    <SliderSkeleton {...$$props} />
  {:else}
    <Slider
      {...$$props}
      id="slider"
      bind:value
      on:change={({ detail }) => {
        console.log('on:change', detail);
      }} />
  {/if}
</Layout>
