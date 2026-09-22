<script>
  import {
    ContextMenu,
    ContextMenuOption,
    TooltipIcon,
  } from "carbon-components-svelte";
  import Information from "carbon-icons-svelte/lib/Information.svelte";
</script>

<ContextMenu>
  <ContextMenuOption labelText="Deploy">
    <svelte:fragment slot="labelChildren">
      Deploy
      <TooltipIcon
        tooltipText="Deploys the latest build to production."
        icon={Information}
      />
    </svelte:fragment>
  </ContextMenuOption>
  <ContextMenuOption labelText="View details" />
</ContextMenu>

<div data-centered>
  <p>Right click anywhere on this page</p>
</div>
