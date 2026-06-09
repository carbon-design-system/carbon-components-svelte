<script lang="ts">
  import ProgressBar from "carbon-components-svelte/ProgressBar/ProgressBar.svelte";
</script>

<ProgressBar labelText="Default label">
  <span slot="labelChildren">Custom label content</span>
</ProgressBar>
