<script lang="ts">
  import SelectableTag from "carbon-components-svelte/Tag/SelectableTag.svelte";
  import SelectableTagGroup from "carbon-components-svelte/Tag/SelectableTagGroup.svelte";
</script>

<SelectableTagGroup {...$$restProps}>
  <SelectableTag value="open">Open</SelectableTag>
  <SelectableTag value="closed">Closed</SelectableTag>
</SelectableTagGroup>
