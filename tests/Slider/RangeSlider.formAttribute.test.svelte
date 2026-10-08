<script lang="ts">
  import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<RangeSlider
  form="outer-form"
  name="min"
  nameUpper="max"
  value={20}
  valueUpper={80}
  labelText="Price"
/>
