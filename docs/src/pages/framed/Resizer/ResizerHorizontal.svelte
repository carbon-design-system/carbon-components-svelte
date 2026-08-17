<script>
  import { Resizer } from "carbon-components-svelte";
</script>

<div
  style="display: flex; flex-direction: column; width: 300px; border: 1px solid var(--cds-border-subtle);"
>
  <div style="height: 120px; padding: 1rem; background: var(--cds-layer);">
    Top panel
  </div>
  <Resizer orientation="horizontal" />
  <div style="flex: 1; padding: 1rem;">Bottom panel</div>
</div>
