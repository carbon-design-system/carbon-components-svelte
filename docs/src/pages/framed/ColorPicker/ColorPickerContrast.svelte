<script>
  import { ColorPicker } from "carbon-components-svelte";

  let value = "#f1c21b";
</script>

<!-- A fixed white surface, so the ratio holds in every theme. -->
<div style="background: #ffffff; padding: 1rem">
  <ColorPicker bind:value background="#ffffff" />
</div>
