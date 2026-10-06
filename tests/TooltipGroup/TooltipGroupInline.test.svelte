<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import TooltipGroup from "carbon-components-svelte/TooltipGroup/TooltipGroup.svelte";
  import TooltipIcon from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
</script>

<TooltipGroup>
  <Button kind="ghost" icon={Edit} iconDescription="Edit" />
  <Button kind="ghost" icon={TrashCan} iconDescription="Delete" />
  <TooltipIcon tooltipText="Synced" icon={Carbon} />
</TooltipGroup>
