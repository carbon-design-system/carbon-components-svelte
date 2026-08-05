<script lang="ts">
  import NumberInputSkeleton from "carbon-components-svelte/NumberInput/NumberInputSkeleton.svelte";

  export let hideLabel = false;
</script>

<NumberInputSkeleton
  data-testid="number-input-skeleton"
  {hideLabel}
  on:click={() => {
    console.log("click");
  }}
  on:mouseover={() => {
    console.log("mouseover");
  }}
  on:mouseenter={() => {
    console.log("mouseenter");
  }}
  on:mouseleave={() => {
    console.log("mouseleave");
  }}
/>
