<script>
  import {
    applySort,
    ContainedList,
    ContainedListItem,
    sortable,
    Stack,
    Tag,
  } from "carbon-components-svelte";

  let steps = [
    { id: "lint", name: "Lint" },
    { id: "test", name: "Unit tests" },
    { id: "build", name: "Build" },
    { id: "scan", name: "Security scan" },
    { id: "deploy", name: "Deploy" },
  ];
  let filters = ["Open", "Assigned to me", "Mentioned", "Blocked"].map(
    (name) => ({ id: name.toLowerCase(), name }),
  );

  function handleSort(event) {
    steps = applySort(steps, event.detail);
  }

  function handleFilterSort(event) {
    filters = applySort(filters, event.detail);
  }
</script>

<Stack gap={7}>
  <div
    use:sortable={{
      itemSelector: ".bx--contained-list-item",
      feedback: "gap",
      label: "Pipeline steps",
    }}
    on:sort={handleSort}
  >
    <ContainedList labelText="Pipeline steps">
      {#each steps as step (step.id)}
        <ContainedListItem data-sortable-id={step.id}>
          {step.name}
        </ContainedListItem>
      {/each}
    </ContainedList>
  </div>

  <div
    use:sortable={{
      orientation: "horizontal",
      itemSelector: ".bx--tag",
      feedback: "gap",
      label: "Saved filters",
    }}
    on:sort={handleFilterSort}
  >
    <Stack orientation="horizontal" gap={3}>
      {#each filters as filter (filter.id)}
        <Tag data-sortable-id={filter.id}>{filter.name}</Tag>
      {/each}
    </Stack>
  </div>
</Stack>
