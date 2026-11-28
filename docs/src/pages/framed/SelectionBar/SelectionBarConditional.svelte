<script>
  import {
    Button,
    Checkbox,
    SelectionBar,
    Stack,
  } from "carbon-components-svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Merge from "carbon-icons-svelte/lib/Merge.svelte";
  import UserFollow from "carbon-icons-svelte/lib/UserFollow.svelte";

  const tickets = [
    { id: "CS-1042", summary: "Invoice shows the wrong billing address" },
    { id: "CS-1047", summary: "Billing address not updated on invoice" },
    { id: "CS-1051", summary: "Password reset email never arrives" },
    { id: "CS-1053", summary: "Export to CSV times out on large reports" },
  ];

  let selectedIds = ["CS-1042"];

  function toggle(id, checked) {
    selectedIds = checked
      ? [...selectedIds, id]
      : selectedIds.filter((selectedId) => selectedId !== id);
  }
</script>

<Stack gap={5}>
  <SelectionBar count={selectedIds.length} on:clear={() => (selectedIds = [])}>
    <svelte:fragment slot="actions">
      {#if selectedIds.length === 1}
        <Button icon={Edit}>Edit</Button>
      {/if}
      <Button icon={UserFollow}>Assign</Button>
      <Button icon={Merge} disabled={selectedIds.length < 2}>Merge</Button>
    </svelte:fragment>
  </SelectionBar>
  <fieldset>
    <legend class="bx--label">Support tickets</legend>
    {#each tickets as ticket (ticket.id)}
      <Checkbox
        labelText="{ticket.id}: {ticket.summary}"
        checked={selectedIds.includes(ticket.id)}
        on:check={(event) => toggle(ticket.id, event.detail)}
      />
    {/each}
  </fieldset>
</Stack>
