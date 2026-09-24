<script lang="ts">
  import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";

  export let value = 0;
  export let valueUpper = 100;
  export let readonly = false;
  export let onChange: (event: CustomEvent) => void = () => {};
</script>

<form data-testid="form">
  <RangeSlider
    bind:value
    bind:valueUpper
    {readonly}
    name="low"
    nameUpper="high"
    labelText="Price"
    on:change={onChange}
  />
</form>
<p data-testid="bound">{value}-{valueUpper}</p>
