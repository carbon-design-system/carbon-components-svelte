<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import CopyButton from "carbon-components-svelte/CopyButton/CopyButton.svelte";
  import TooltipGroup from "carbon-components-svelte/TooltipGroup/TooltipGroup.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Grid from "carbon-icons-svelte/lib/Grid.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  export let enterDelayMs: number | undefined = undefined;
  export let leaveDelayMs: number | undefined = undefined;
  export let skipDelayMs: number | undefined = undefined;
</script>

<TooltipGroup {enterDelayMs} {leaveDelayMs} {skipDelayMs}>
  <Button portalTooltip kind="ghost" icon={Edit} iconDescription="Edit" />
  <CopyButton text="copied" iconDescription="Copy link" />
  <ContentSwitcher>
    <Switch icon={List} text="List view" />
    <Switch icon={Grid} text="Grid view" />
  </ContentSwitcher>
</TooltipGroup>

<Button portalTooltip kind="ghost" icon={TrashCan} iconDescription="Delete" />
