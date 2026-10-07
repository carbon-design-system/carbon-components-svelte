<script lang="ts">
  import Form from "carbon-components-svelte/Form/Form.svelte";
  import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
  import Slider from "carbon-components-svelte/Slider/Slider.svelte";
  import type { ComponentProps } from "svelte";

  export let formSize: ComponentProps<Form>["size"] = undefined;
</script>

<Form size={formSize}>
  <Slider labelText="Replicas" value={4} max={10} />
  <RangeSlider labelText="Window" value={2} valueUpper={8} max={10} />
</Form>
