<script lang="ts">
  import CopyInputSkeleton from "carbon-components-svelte/CopyInput/CopyInputSkeleton.svelte";

  export let hideLabel = false;
</script>

<CopyInputSkeleton
  data-testid="copy-input-skeleton"
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
