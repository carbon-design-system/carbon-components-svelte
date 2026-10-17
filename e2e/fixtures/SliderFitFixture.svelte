<script>
  import { RangeSlider, Slider } from "carbon-components-svelte";
</script>

<!-- Sliders in boxes from narrow to wide, and full width. -->
{#each [200, 320, 600] as width}
  <div data-testid="slider-{width}" style="width: {width}px; margin: 1rem;">
    <Slider labelText="Volume" value={40} />
  </div>
  <div data-testid="range-{width}" style="width: {width}px; margin: 1rem;">
    <RangeSlider labelText="Price" valueFrom={20} valueTo={60} />
  </div>
{/each}
<div data-testid="full-600" style="width: 600px; margin: 1rem;">
  <Slider fullWidth labelText="Volume" value={40} />
</div>
