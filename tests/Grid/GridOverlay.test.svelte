<script lang="ts">
  import GridOverlay from "carbon-components-svelte/Grid/GridOverlay.svelte";

  export let open = false;
  export let condensed = false;
  export let narrow = false;
  export let fullWidth = false;
  export let gutters = false;
</script>

<GridOverlay
  {open}
  {condensed}
  {narrow}
  {fullWidth}
  {gutters}
  {...$$restProps}
/>
