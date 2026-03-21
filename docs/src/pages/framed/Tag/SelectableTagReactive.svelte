<script>
  import { SelectableTag } from "carbon-components-svelte";

  let selected = false;
</script>

<SelectableTag bind:selected on:change>
  {selected ? "Selected" : "Unselected"}
</SelectableTag>
