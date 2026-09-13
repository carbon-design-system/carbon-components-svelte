<script>
  import FluidSelectSkeleton from "../Select/FluidSelectSkeleton.svelte";
  import FluidTextInputSkeleton from "../TextInput/FluidTextInputSkeleton.svelte";

  /** Set to `true` if there are only two time picker elements */
  export let isOnlyTwo = false;
</script>

<div
  class:bx--time-picker--fluid--skeleton={true}
  class:bx--time-picker--equal-width={isOnlyTwo}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <FluidTextInputSkeleton />
  <FluidSelectSkeleton />
  {#if !isOnlyTwo}
    <FluidSelectSkeleton />
  {/if}
</div>
