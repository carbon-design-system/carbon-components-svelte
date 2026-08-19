<script lang="ts">
  import FluidTextInputSkeleton from "carbon-components-svelte/TextInput/FluidTextInputSkeleton.svelte";
  import TextInputSkeleton from "carbon-components-svelte/TextInput/TextInputSkeleton.svelte";

  export let component = "fluid";
</script>

{#if component === "fluid"}
  <FluidTextInputSkeleton
    data-testid="skeleton"
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
{:else}
  <TextInputSkeleton
    data-testid="skeleton"
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
{/if}
