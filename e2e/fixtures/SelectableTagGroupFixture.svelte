<script>
  import {
    SelectableTag,
    SelectableTagGroup,
    Stack,
  } from "carbon-components-svelte";

  let status = ["open"];
  let priority = ["medium"];
</script>

<Stack gap={6}>
  <SelectableTagGroup
    data-testid="status"
    bind:selected={status}
    legendText="Status"
  >
    <SelectableTag value="open">Open</SelectableTag>
    <SelectableTag value="in-progress">In progress</SelectableTag>
    <SelectableTag value="closed">Closed</SelectableTag>
    <SelectableTag value="wont-fix">Won't fix</SelectableTag>
    <SelectableTag value="duplicate">Duplicate</SelectableTag>
  </SelectableTagGroup>

  <SelectableTagGroup
    data-testid="priority"
    bind:selected={priority}
    legendText="Priority"
    selectionMode="single"
    required
    size="sm"
  >
    <SelectableTag value="low">Low</SelectableTag>
    <SelectableTag value="medium">Medium</SelectableTag>
    <SelectableTag value="high">High</SelectableTag>
  </SelectableTagGroup>

  <SelectableTagGroup
    data-testid="disabled"
    selected={["a"]}
    legendText="Disabled"
    size="lg"
    disabled
  >
    <SelectableTag value="a">Alpha</SelectableTag>
    <SelectableTag value="b">Beta</SelectableTag>
  </SelectableTagGroup>

  <output data-testid="status-value">{JSON.stringify(status)}</output>
</Stack>
