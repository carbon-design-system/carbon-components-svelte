<script>
  import {
    Button,
    ContentSwitcher,
    Switch,
    TooltipGroup,
  } from "carbon-components-svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Grid from "carbon-icons-svelte/lib/Grid.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";
</script>

<div style="padding: 4rem; display: flex; gap: 1rem; align-items: center">
  <TooltipGroup>
    <Button kind="ghost" icon={Edit} iconDescription="Edit" />
    <Button kind="ghost" icon={Copy} iconDescription="Duplicate" />
    <ContentSwitcher size="sm">
      <Switch icon={List} text="List view" />
      <Switch icon={Grid} text="Grid view" />
    </ContentSwitcher>
  </TooltipGroup>
</div>
