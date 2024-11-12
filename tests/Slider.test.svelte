<script lang="ts">
  import { Slider, SliderSkeleton } from "carbon-components-svelte";
</script>

<Slider />

<Slider
  labelText="Runtime memory (MB)"
  min={10}
  max={990}
  maxLabel="990 MB"
  value={100}
  fullWidth
  on:change={(e) => {
    console.log(e.detail); // number
  }}
  on:input={(e) => {
    console.log(e.detail); // number
  }}
/>

<Slider
  labelText="Runtime memory (MB)"
  min={10}
  max={990}
  maxLabel="990 MB"
  value={100}
  step={10}
/>

<Slider
  light
  labelText="Runtime memory (MB)"
  min={10}
  max={990}
  maxLabel="990 MB"
  value={100}
  step={10}
/>

<SliderSkeleton />

<SliderSkeleton hideLabel />
