<script lang="ts">
  import Slider from "carbon-components-svelte/Slider/Slider.svelte";

  export let value = 20;
  export let hideTextInput = false;
</script>

<form data-testid="form">
  <Slider
    bind:value
    {hideTextInput}
    name="level"
    labelText="Level"
    min={0}
    max={100}
  />
</form>
<p data-testid="bound">{value}</p>
