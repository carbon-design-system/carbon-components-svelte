<script>
  import {
    applySort,
    ContainedList,
    ContainedListItem,
    sortable,
  } from "carbon-components-svelte";

  let steps = [
    { id: "lint", name: "Lint" },
    { id: "test", name: "Unit tests" },
    { id: "build", name: "Build" },
    { id: "scan", name: "Security scan" },
    { id: "deploy", name: "Deploy" },
  ];

  function handleSort(event) {
    steps = applySort(steps, event.detail);
  }
</script>

<div
  use:sortable={{ itemSelector: ".bx--contained-list-item" }}
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
