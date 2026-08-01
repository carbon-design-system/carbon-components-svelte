<script>
  import { OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";

  const workspaces = Array.from(
    { length: 20 },
    (_, index) => `Workspace ${index + 1}`,
  );
</script>

<OverflowMenu maxHeight={240}>
  {#each workspaces as workspace (workspace)}
    <OverflowMenuItem text={workspace} />
  {/each}
  <OverflowMenuItem hasDivider danger text="Delete service" />
</OverflowMenu>
