<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import TooltipGroup from "carbon-components-svelte/TooltipGroup/TooltipGroup.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
</script>

<TooltipGroup>
  <Button kind="ghost" icon={Edit} iconDescription="Edit" />
</TooltipGroup>
