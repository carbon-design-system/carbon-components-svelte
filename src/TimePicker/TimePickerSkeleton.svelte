<script>
  /**
   * Set the size of the skeleton to match the time picker it stands in for.
   * @type {"xs" | "sm" | "xl"}
   */
  export let size = undefined;

  import SelectSkeleton from "../Select/SelectSkeleton.svelte";
  import TextInputSkeleton from "../TextInput/TextInputSkeleton.svelte";
</script>

<div
  class:bx--time-picker={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:bx--time-picker__input={true}>
    <TextInputSkeleton {size} />
  </div>
  <div class:bx--time-picker__select={true}>
    <SelectSkeleton {size} hideLabel />
  </div>
  <div class:bx--time-picker__select={true}>
    <SelectSkeleton {size} hideLabel />
  </div>
</div>
