<script>
  import {
    OverflowMenu,
    OverflowMenuItem,
    Stack,
  } from "carbon-components-svelte";
</script>

<Stack
  gap={4}
  style="overflow: hidden; border: 1px dashed var(--cds-border-subtle); padding: 1rem; max-height: 120px;"
>
  <div>
    This container has hidden overflow. Without <code>portalMenu</code>, the
    menu would be clipped.
  </div>
  <OverflowMenu portalMenu>
    <OverflowMenuItem text="Edit" />
    <OverflowMenuItem text="Duplicate" />
    <OverflowMenuItem danger text="Delete" />
  </OverflowMenu>
</Stack>
