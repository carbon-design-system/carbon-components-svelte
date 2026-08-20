<script>
  import { Resizer } from "carbon-components-svelte";
  import DragVertical from "carbon-icons-svelte/lib/DragVertical.svelte";
</script>

<div
  style="display: flex; height: 200px; border: 1px solid var(--cds-border-subtle);"
>
  <div style="width: 200px; padding: 1rem; background: var(--cds-layer);">
    Left panel
  </div>
  <Resizer
    orientation="vertical"
    style="display: flex; align-items: center; justify-content: center;"
  >
    <DragVertical size={16} />
  </Resizer>
  <div style="flex: 1; padding: 1rem;">Right panel</div>
</div>
