<script>
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
    <TextInputSkeleton />
  </div>
  <div class:bx--time-picker__select={true}>
    <SelectSkeleton hideLabel />
  </div>
  <div class:bx--time-picker__select={true}>
    <SelectSkeleton hideLabel />
  </div>
</div>
