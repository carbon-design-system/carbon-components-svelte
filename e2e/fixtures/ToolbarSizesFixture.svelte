<script>
  import {
    Button,
    Toolbar,
    ToolbarBatchActions,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
</script>

<!--
  The small and extra-small toolbars, which resize their search and buttons:
  a persistent search, an expandable one kept open by its value, and a
  button, then the
  batch actions bar. CSS coverage for `.bx--table-toolbar--small` and
  `--xs`, which no other fixture renders.
-->
{#each ["sm", "xs"] as size}
  <div data-testid="toolbar-{size}">
    <Toolbar {size}>
      <ToolbarContent>
        <ToolbarSearch persistent value="Search" />
        <ToolbarSearch expanded value="Query" />
        <Button>Add</Button>
      </ToolbarContent>
    </Toolbar>
    <Toolbar {size}>
      <ToolbarBatchActions selectedIds={[1, 2]} active>
        <Button>Delete</Button>
      </ToolbarBatchActions>
    </Toolbar>
  </div>
{/each}
