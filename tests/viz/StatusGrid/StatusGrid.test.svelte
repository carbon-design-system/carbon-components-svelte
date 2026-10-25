<script lang="ts">
  import StatusGrid from "carbon-components-svelte/viz/StatusGrid/StatusGrid.svelte";

  export let data: ReadonlyArray<{ name: string; state: string }> = [];
  export let selectable = false;
  export let onselect: (detail: unknown) => void = () => {};
</script>

<StatusGrid
  {data}
  id="name"
  status="state"
  title="Pods"
  {selectable}
  on:select={(e) => onselect(e.detail)}
/>
