<script lang="ts">
  import Slider from "carbon-components-svelte/Slider/Slider.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<Slider form="outer-form" name="volume" value={40} labelText="Volume" />
