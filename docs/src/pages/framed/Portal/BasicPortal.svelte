<script>
  import { Portal } from "carbon-components-svelte";
</script>

<div>
  <div>Rendered inside the dashboard panel</div>
  <br>
  <Portal>Rendered outside the panel, directly in document.body</Portal>
</div>
