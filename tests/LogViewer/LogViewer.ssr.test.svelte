<script lang="ts">
  import LogViewer from "carbon-components-svelte/LogViewer/LogViewer.svelte";

  export let lines: string[] = [];
</script>

<LogViewer {lines} labelText="Build output" timestamps />
