<script lang="ts">
  import AspectRatio from "carbon-components-svelte/AspectRatio/AspectRatio.svelte";
</script>

<AspectRatio fill>
  <div data-testid="fill-content">Fill content</div>
</AspectRatio>

<AspectRatio align="center" justify="end">
  <div data-testid="aligned-content">Aligned content</div>
</AspectRatio>

<AspectRatio justify="space-between">
  <div data-testid="space-between-content">Space between</div>
</AspectRatio>
