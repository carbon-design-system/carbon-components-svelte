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
<!-- An invalid slider's number input is wider (it holds the icon). -->
<div data-testid="invalid-200" style="width: 200px; margin: 1rem;">
  <Slider labelText="Volume" value={40} invalid invalidText="Too loud" />
</div>
<!-- A slider in a container sized to its content. -->
<div data-testid="content-sized" style="display: inline-block; margin: 1rem;">
  <Slider labelText="Volume" value={40} />
</div>
<div data-testid="full-600" style="width: 600px; margin: 1rem;">
  <Slider fullWidth labelText="Volume" value={40} />
</div>
