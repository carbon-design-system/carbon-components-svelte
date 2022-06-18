<script lang="ts">
  import { Slider, SliderSkeleton } from "../types";
</script>

<Slider />

<Slider
  labelText="Runtime memory (MB)"
  min="{10}"
  max="{990}"
  maxLabel="990 MB"
  value="{100}"
  fullWidth
/>

<Slider
  labelText="Runtime memory (MB)"
  min="{10}"
  max="{990}"
  maxLabel="990 MB"
  value="{100}"
  step="{10}"
/>

<Slider
  light
  labelText="Runtime memory (MB)"
  min="{10}"
  max="{990}"
  maxLabel="990 MB"
  value="{100}"
  step="{10}"
/>

<SliderSkeleton />

<SliderSkeleton hideLabel />
