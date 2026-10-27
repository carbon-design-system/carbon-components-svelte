<script>
  import { SelectableTag, SelectableTagGroup } from "carbon-components-svelte";

  let selected = ["open", "in-progress"];
</script>

<SelectableTagGroup bind:selected legendText="Status" on:change>
  <SelectableTag value="open">Open</SelectableTag>
  <SelectableTag value="in-progress">In progress</SelectableTag>
  <SelectableTag value="closed">Closed</SelectableTag>
  <SelectableTag value="wont-fix">Won't fix</SelectableTag>
</SelectableTagGroup>

<p>Selected: {selected.join(", ") || "none"}</p>
