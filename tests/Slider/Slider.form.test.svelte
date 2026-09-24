<script lang="ts">
  import Slider from "carbon-components-svelte/Slider/Slider.svelte";
  import type { ComponentProps } from "svelte";

  export let value = 0;
  export let readonly: ComponentProps<Slider>["readonly"] = false;
  export let onChange: (event: CustomEvent<number>) => void = () => {};
</script>

<form data-testid="form">
  <Slider
    bind:value
    {readonly}
    name="volume"
    labelText="Volume"
    min={0}
    max={100}
    on:change={onChange}
  />
</form>
<p data-testid="bound">{value}</p>
