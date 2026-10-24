<script>
  import {
    Button,
    ContentSwitcher,
    CopyButton,
    OverflowMenu,
    OverflowMenuItem,
    PasswordInput,
    Switch,
    TooltipIcon,
  } from "carbon-components-svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Grid from "carbon-icons-svelte/lib/Grid.svelte";
  import Information from "carbon-icons-svelte/lib/Information.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";

  let edits = 0;
</script>

<div
  style="padding: 6rem; display: flex; flex-wrap: wrap; gap: 8rem; align-items: center"
>
  <Button
    kind="ghost"
    icon={Edit}
    iconDescription="Edit service"
    on:click={() => edits++}
  />
  <Button
    kind="ghost"
    icon={Copy}
    iconDescription="Duplicate service"
    portalTooltip
  />
  <TooltipIcon tooltipText="Region details" icon={Information} />
  <TooltipIcon tooltipText="Plan details" icon={Information} portalTooltip />
  <CopyButton text="us-east-1" iconDescription="Copy region" />
  <OverflowMenu iconDescription="Service options">
    <OverflowMenuItem text="Restart" />
  </OverflowMenu>
  <ContentSwitcher size="sm">
    <Switch icon={List} text="List view" />
    <Switch icon={Grid} text="Grid view" />
  </ContentSwitcher>
  <PasswordInput labelText="API key" />
  <output data-testid="edits">{edits}</output>
</div>
