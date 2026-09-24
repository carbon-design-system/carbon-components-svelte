<script lang="ts">
  import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";

  export let value = 10;
  export let valueUpper = 90;
</script>

<form data-testid="form">
  <RangeSlider
    bind:value
    bind:valueUpper
    name="low"
    nameUpper="high"
    labelText="Range"
    min={0}
    max={100}
  />
</form>
<p data-testid="bound">{value}-{valueUpper}</p>
