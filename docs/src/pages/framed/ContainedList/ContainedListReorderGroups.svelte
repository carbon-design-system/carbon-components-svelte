<script>
  import {
    applySort,
    Button,
    ContainedList,
    ContainedListItem,
    sortable,
    Stack,
  } from "carbon-components-svelte";
  import Draggable from "carbon-icons-svelte/lib/Draggable.svelte";

  let lists = {
    backlog: [
      { id: "mfa", name: "Enforce MFA for admins" },
      { id: "audit", name: "Export the audit log" },
      { id: "sso", name: "Add SAML single sign-on" },
    ],
    sprint: [{ id: "rotate", name: "Rotate API keys" }],
  };
  const labels = { backlog: "Backlog", sprint: "This sprint" };

  function handleSort(event) {
    lists = applySort(lists, event.detail);
  }
</script>

<Stack orientation="horizontal" gap={6}>
  {#each Object.keys(lists) as name (name)}
    <div
      use:sortable={{
        name,
        label: labels[name],
        group: "planning",
        itemSelector: ".bx--contained-list-item",
        handleSelector: "[data-sortable-handle]",
      }}
      on:sort={handleSort}
    >
      <ContainedList labelText={labels[name]}>
        {#each lists[name] as task (task.id)}
          <ContainedListItem data-sortable-id={task.id}>
            {task.name}
            <Button
              slot="action"
              kind="ghost"
              size="small"
              icon={Draggable}
              iconDescription="Reorder {task.name}"
              tooltipPosition="left"
              data-sortable-handle
            />
          </ContainedListItem>
        {/each}
      </ContainedList>
    </div>
  {/each}
</Stack>
