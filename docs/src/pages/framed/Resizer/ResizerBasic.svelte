<script>
  import { Resizer } from "carbon-components-svelte";
</script>

<div
  style="display: flex; height: 200px; border: 1px solid var(--cds-border-subtle);"
>
  <div style="width: 200px; padding: 1rem; background: var(--cds-layer);">
    Left panel
  </div>
  <Resizer orientation="vertical" />
  <div style="flex: 1; padding: 1rem;">Right panel</div>
</div>
